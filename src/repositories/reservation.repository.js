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

export const reservationRepository = {
  listBlockingByLot,
};
