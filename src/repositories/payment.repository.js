import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS } from '../constants/index.js';

async function findByReservation(reservationId, tx) {
  const ref = db.collection(COLLECTIONS.PAYMENTS).doc(reservationId);
  const snap = await (tx ? tx.get(ref) : ref.get());

  return fromSnap(snap);
}

async function upsert(tx, id, data) {
  const ref = db.collection(COLLECTIONS.PAYMENTS).doc(id);

  await tx.set(ref, data, { merge: true });
}

async function listByStatus(status, limit) {
  const snap = await db
    .collection(COLLECTIONS.PAYMENTS)
    .where('status', '==', status)
    .limit(limit)
    .get();

  return snap.docs.map(fromSnap);
}

export const paymentRepository = {
  findByReservation,
  upsert,
  listByStatus,
};
