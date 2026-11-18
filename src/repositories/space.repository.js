import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS } from '../constants/index.js';

async function listActiveByLot(lotId, tx) {
  const query = db
    .collection(COLLECTIONS.SPACES)
    .where('parking_lot_id', '==', lotId)
    .where('active', '==', true);

  const snap = await (tx ? tx.get(query) : query.get());

  return snap.docs.map(fromSnap);
}

export const spaceRepository = {
  listActiveByLot,
};
