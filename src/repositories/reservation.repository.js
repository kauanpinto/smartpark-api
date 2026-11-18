import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS, BLOCKING_STATUSES } from '../constants/index.js';

async function listBlockingByLot(lotId, tx) {
  const query = db
    .collection(COLLECTIONS.RESERVATIONS)
    .where('parking_lot_id', '==', lotId)
    .where('status', 'in', BLOCKING_STATUSES);

  const snap = await (tx ? tx.get(query) : query.get());

  return snap.docs.map(fromSnap);
}

async function create(tx, id, data) {
  const ref = db.collection(COLLECTIONS.RESERVATIONS).doc(id);

  await tx.create(ref, data);
}

async function update(tx, id, data) {
  const ref = db.collection(COLLECTIONS.RESERVATIONS).doc(id);

  await tx.update(ref, data);
}

async function findById(id, tx) {
  const ref = db.collection(COLLECTIONS.RESERVATIONS).doc(id);
  const snap = await (tx ? tx.get(ref) : ref.get());

  return fromSnap(snap);
}

async function listByUser(uid, limit) {
  const snap = await db
    .collection(COLLECTIONS.RESERVATIONS)
    .where('user_id', '==', uid)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(fromSnap);
}

export const reservationRepository = {
  listBlockingByLot,
  create,
  update,
  findById,
  listByUser,
};
