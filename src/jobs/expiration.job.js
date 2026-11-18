import { db } from '../config/firebase.js';
import { RESERVATION_STATUS, JOB_INTERVALS_MS } from '../constants/index.js';
import { reservationRepository } from '../repositories/reservation.repository.js';

async function expireOne(id, expectedStatus) {
  await db.runTransaction(async (tx) => {
    const current = await reservationRepository.findById(id, tx);

    if (!current) return;

    if (current.status !== expectedStatus) return;

    await reservationRepository.update(tx, id, {
      status: RESERVATION_STATUS.EXPIRED,
      updated_at: new Date(),
    });
  });
}

export async function runExpiration() {
  const now = new Date();

  const [pending, noShow] = await Promise.all([
    reservationRepository.listPendingExpired(now),
    reservationRepository.listConfirmedNoShow(now),
  ]);

  for (const reservation of pending) {
    try {
      await expireOne(reservation.id, RESERVATION_STATUS.PENDING_PAYMENT);
    } catch (error) {
      console.error('[expiration.pending]', reservation.id, error);
    }
  }

  for (const reservation of noShow) {
    try {
      await expireOne(reservation.id, RESERVATION_STATUS.CONFIRMED);
    } catch (error) {
      console.error('[expiration.noShow]', reservation.id, error);
    }
  }
}

export function startExpirationJob() {
  const timer = setInterval(() => {
    runExpiration().catch((error) => {
      console.error('[expiration.job]', error);
    });
  }, JOB_INTERVALS_MS.EXPIRATION);

  timer.unref();

  return timer;
}
