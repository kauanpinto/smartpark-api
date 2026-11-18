import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { mpHttp } from '../config/mercadopago.js';
import { RESERVATION_STATUS } from '../constants/index.js';
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

  const checkout_url = response.data.sandbox_init_point ?? response.data.init_point;

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

export const paymentService = {
  createCheckout,
};
