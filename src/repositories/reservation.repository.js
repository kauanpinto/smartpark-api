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

export const reservationRepository = {
  listBlockingByLot,
  create,
  update,
};
