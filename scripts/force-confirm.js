import { env } from '../src/config/env.js';
import { db } from '../src/config/firebase.js';
import { RESERVATION_STATUS } from '../src/constants/index.js';
import { reservationRepository } from '../src/repositories/reservation.repository.js';

if (env.NODE_ENV === 'production') {
  console.error('ERRO FATAL: force-confirm NÃO PODE rodar em produção!');
  process.exit(1);
}

const id = process.argv[2];

if (!id) {
  console.error('Sem código da reserva!');
  process.exit(1);
}

await db.runTransaction(async (tx) => {
  const reservation = await reservationRepository.findById(id, tx);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  if (reservation.status !== RESERVATION_STATUS.PENDING_PAYMENT) {
    throw new Error('INVALID_STATE');
  }

  await reservationRepository.update(tx, id, {
    status: 'CONFIRMED',
    expires_at: null,
    updated_at: new Date(),
  });
});

console.log(`Reserva ${id} confirmada!`);
