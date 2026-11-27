import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { mpPaymentClient, mpPreference } from '../config/mercadopago.js';
import { RESERVATION_STATUS } from '../constants/index.js';
import { verifyMpSignature } from '../utils/mp-signature.js';
import { notificationService } from './notification.service.js';
import { parkingLotRepository } from '../repositories/parking-lot.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';

async function createCheckout(uid, reservationId) {
  const reservation = await reservationRepository.findById(reservationId);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  if (reservation.user_id !== uid) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  if (reservation.status !== RESERVATION_STATUS.PENDING_PAYMENT) {
    throw new Error('INVALID_STATE');
  }

  if (reservation.expires_at <= new Date()) {
    throw new Error('RESERVATION_EXPIRED');
  }

  const existing = await paymentRepository.findByReservation(reservationId);

  if (existing?.checkout_url) {
    return { checkout_url: existing.checkout_url };
  }

  const body = {
    items: [
      {
        title: `Reserva SmartPark ${reservationId}`,
        quantity: 1,
        unit_price: reservation.price_estimate_cents / 100,
        currency_id: 'BRL',
      },
    ],
    external_reference: reservationId,
    notification_url: `${env.APP_BASE_URL}/webhooks/mercadopago`,
    back_urls: {
      success: `${env.WEB_ORIGIN}/payment.html?result=success&reservation=${reservationId}`,
      pending: `${env.WEB_ORIGIN}/payment.html?result=pending&reservation=${reservationId}`,
      failure: `${env.WEB_ORIGIN}/payment.html?result=failure&reservation=${reservationId}`,
    },
    ...(env.WEB_ORIGIN.startsWith('https://') && { auto_return: 'approved' }),
    expires: true,
    expiration_date_to: reservation.expires_at.toISOString(),
  };

  let preference;

  try {
    preference = await mpPreference.create({ body });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('MERCADOPAGO_TIMEOUT');
    }

    const status = error.status ?? error.response?.status;

    if (status >= 400) {
      console.error('[mercadopago.reject]', {
        status,
        message: error.message,
        cause: error.cause,
      });
      throw new Error('MERCADOPAGO_ERROR');
    }

    throw error;
  }

  const checkout_url = preference.init_point;

  await db.runTransaction(async (tx) => {
    await paymentRepository.upsert(tx, reservationId, {
      reservation_id: reservationId,
      provider: 'mercadopago',
      preference_id: String(preference.id),
      checkout_url,
      status: 'PENDING',
      amount_cents: reservation.price_estimate_cents,
      currency: 'BRL',
      verified_at: null,
    });
  });

  return { checkout_url };
}

async function handleWebhook({ query, headers, body }) {
  const type = query.type ?? query.topic ?? body?.type;

  if (type !== 'payment') {
    return { received: true };
  }

  const paymentId = query['data.id'] ?? query.id ?? body?.data?.id;

  if (!paymentId) {
    return { received: true };
  }

  if (!verifyMpSignature({ headers, query, body })) {
    throw new Error('INVALID_SIGNATURE');
  }

  let mpPaymentData;

  try {
    mpPaymentData = await mpPaymentClient.get({ id: String(paymentId) });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('MERCADOPAGO_TIMEOUT');
    }

    const status = error.status ?? error.response?.status;

    if (status === 404) {
      return { received: true, ignored: 'payment_not_found' };
    }

    if (status === 401 || status === 403) {
      console.error('[webhook.mp_auth_error]', {
        paymentId,
        status,
        message: error.message,
        cause: error.cause,
      });
      return { received: true, ignored: 'mp_unauthorized' };
    }

    if (status >= 400) {
      throw new Error(`MERCADOPAGO_ERROR:${status}:${error.message}`);
    }

    throw error;
  }

  const reservationId = mpPaymentData.external_reference;

  if (!reservationId) {
    return { received: true };
  }

  const now = new Date();
  const mpPaymentId = String(mpPaymentData.id);
  const mpStatus = mpPaymentData.status;
  const mpAmountCents = Math.round(mpPaymentData.transaction_amount * 100);
  const mpCurrency = mpPaymentData.currency_id;

  const transactionResult = await db.runTransaction(async (tx) => {
    const reservation = await reservationRepository.findById(reservationId, tx);

    if (!reservation) {
      console.error('[webhook] reservation not found', { reservationId });
      return { skip: true };
    }

    const existingPayment = await paymentRepository.findByReservation(reservationId, tx);

    if (mpAmountCents !== reservation.price_estimate_cents || mpCurrency !== 'BRL') {
      await paymentRepository.upsert(tx, reservationId, {
        payment_id: mpPaymentId,
        status: 'MISMATCH',
        verified_at: now,
      });

      return { mismatch: true, expected: reservation.price_estimate_cents };
    }

    await paymentRepository.upsert(tx, reservationId, {
      payment_id: mpPaymentId,
      status: mpStatus,
      verified_at: now,
    });

    if (mpStatus !== 'approved') {
      return { noop: true };
    }

    if (reservation.status === RESERVATION_STATUS.PENDING_PAYMENT) {
      const stillValid = reservation.expires_at && reservation.expires_at > now;

      if (stillValid) {
        await reservationRepository.update(tx, reservationId, {
          status: RESERVATION_STATUS.CONFIRMED,
          expires_at: null,
          updated_at: now,
        });

        return {
          confirmed: true,
          reservation: { ...reservation, status: RESERVATION_STATUS.CONFIRMED },
        };
      } else {
        await paymentRepository.upsert(tx, reservationId, { status: 'NEEDS_REFUND' });
        console.error('[ALERT_OPS]', {
          key: `${reservationId}_NEEDS_REFUND`,
          reason: 'approved payment for expired reservation',
        });

        return { needsRefund: true, reason: 'expired' };
      }
    }

    if (reservation.status === RESERVATION_STATUS.CONFIRMED) {
      if (existingPayment?.payment_id && existingPayment.payment_id !== mpPaymentId) {
        await paymentRepository.upsert(tx, reservationId, { status: 'MISMATCH' });

        return { doublePayment: true, newPaymentId: mpPaymentId };
      }
      return { noop: true };
    }

    if (reservation.status === RESERVATION_STATUS.EXPIRED) {
      await paymentRepository.upsert(tx, reservationId, { status: 'NEEDS_REFUND' });

      return { needsRefund: true, reason: 'expired' };
    }

    console.error('[webhook] approved payment in unexpected state', {
      reservationId,
      status: reservation.status,
    });

    await paymentRepository.upsert(tx, reservationId, { status: 'NEEDS_REFUND' });

    return { mismatch: false };
  });

  if (transactionResult?.mismatch) {
    await notificationService.alertOps(
      `payment_mismatch_${reservationId}`,
      `Pagamento com divergência. Reserva ${reservationId}. Esperado ${transactionResult.expected}c, recebido ${mpAmountCents}c`,
    );
  }

  if (transactionResult?.needsRefund) {
    await notificationService.alertOps(
      `payment_needs_refund_${reservationId}`,
      `Pagamento aprovado para reserva expirada. Reserva ${reservationId}. Fazer reembolso manual no MP.`,
    );
  }

  if (transactionResult?.doublePayment) {
    await notificationService.alertOps(
      `payment_double_${reservationId}`,
      `Pagamento duplicado. Reserva ${reservationId} já confirmada. Novo payment: ${transactionResult.newPaymentId}.`,
    );
  }

  if (transactionResult?.confirmed) {
    const lot = await parkingLotRepository.findById(transactionResult.reservation.parking_lot_id);
    await notificationService.notify({
      key: `${reservationId}_RESERVATION_CONFIRMED`,
      userId: transactionResult.reservation.user_id,
      type: 'RESERVATION_CONFIRMED',
      text: notificationService.buildConfirmationText(
        transactionResult.reservation,
        lot?.name ?? 'Estacionamento',
        transactionResult.reservation.space_id,
      ),
    });
  }

  return { received: true };
}

export const paymentService = {
  createCheckout,
  handleWebhook,
};
