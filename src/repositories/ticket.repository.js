import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../constants/index.js';

async function create(tx, reservationId, data) {
  const ref = db.collection(COLLECTIONS.TICKETS).doc(reservationId);

  await tx.create(ref, data);
}

export const ticketRepository = { create };
