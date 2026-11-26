import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { mpHttp } from '../config/mercadopago.js';
import { RESERVATION_STATUS } from '../constants/index.js';
import { verifyMpSignature } from '../utils/mp-signature.js';
import { notificationService } from './notification.service.js';
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

  let response;

  try {
    response = await mpHttp.post('/checkout/preferences', body);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('MERCADOPAGO_TIMEOUT');
    }

    if (error.response?.status >= 400) {
      console.error('[mercadopago.reject]', {
        status: error.response.status,
        data: error.response.data,
      });
      throw new Error('MERCADOPAGO_ERROR');
    }

    throw error;
  }

  const checkout_url = response.data.init_point;

  await db.runTransaction(async (tx) => {
    await paymentRepository.upsert(tx, reservationId, {
      reservation_id: reservationId,
      provider: 'mercadopago',
      preference_id: response.data.id,
      checkout_url,
      status: 'PENDING',
      amount_cents: reservation.price_estimate_cents,
      currency: 'BRL',
      verified_at: null,
    });
  });

  return { checkout_url };
}

async function handleWebhook({ query, headers }) {
  const type = query.type ?? query.topic;

  if (type !== 'payment') {
    return { received: true };
  }

  const paymentId = query['data.id'] ?? query.id;

  if (!paymentId) {
    throw new Error('INVALID_WEBHOOK');
  }

  if (!verifyMpSignature({ headers, query })) {
    throw new Error('INVALID_SIGNATURE');
  }

  let mpPayment;

  try {
    mpPayment = await mpHttp.get(`/v1/payments/${paymentId}`);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('MERCADOPAGO_TIMEOUT');
    }

    if (error.response?.status >= 400) {
      console.error('[mercadopago.webhook.reject]', {
        status: error.response.status,
        data: error.response.data,
      });

      throw new Error('MERCADOPAGO_ERROR');
    }

    throw error;
  }

  const reservationId = mpPayment.data.external_reference;

  if (!reservationId) {
    throw new Error('INVALID_WEBHOOK');
  }

  const now = new Date();
  const mpPaymentId = String(mpPayment.data.id);
  const mpStatus = mpPayment.data.status;
  const mpAmountCents = Math.round(mpPayment.data.transaction_amount * 100);
  const mpCurrency = mpPayment.data.currency_id;

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

    if (mpStatus !== 'approved') return;

    if (reservation.status === RESERVATION_STATUS.PENDING_PAYMENT) {
      const stillValid = reservation.expires_at && reservation.expires_at > now;

      if (stillValid) {
        await reservationRepository.update(tx, reservationId, {
          status: RESERVATION_STATUS.CONFIRMED,
          expires_at: null,
          updated_at: now,
        });
      } else {
        await paymentRepository.upsert(tx, reservationId, { status: 'NEEDS_REFUND' });
        console.error('[ALERT_OPS]', {
          key: `${reservationId}_NEEDS_REFUND`,
          reason: 'approved payment for expired reservation',
        });
      }

      return;
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

  if (transactionResult.mismatch) {
    await notificationService.alertOps(
      `payment_mismatch_${reservationId}`,
      `Pagamento com divergência. Reserva ${reservationId}. Esperado ${transactionResult.expected}c, recebido ${mpAmountCents}c`,
    );
  }

  if (transactionResult.needsRefund) {
    await notificationService.alertOps(
      `payment_needs_refund_${reservationId}`,
      `Pagamento aprovado para reserva expirada. Reserva ${reservationId}. Fazer reembolso manual no MP.`,
    );
  }

  if (transactionResult.doublePayment) {
    await notificationService.alertOps(
      `payment_double_${reservationId}`,
      `Pagamento duplicado. Reserva ${reservationId} já confirmada. Novo payment: ${transactionResult.newPaymentId}.`,
    );
  }

  if (transactionResult.confirmed) {
    const lot = await parkingLotRepository.findById(transactionResult.reservation.parking_lot_id);
    await notificationService.notify({
      key: `${reservationId}_RESERVATION_CONFIRMED`,
      userId: transactionResult.reservation.user_id,
      type: 'RESERVATION_CONFIRMED',
      text: notificationService.buildConfirmationText(
        transactionResult.reservation,
        lot.name,
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
