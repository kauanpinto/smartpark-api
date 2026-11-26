import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS } from '../constants/index.js';

async function listActive() {
  const snap = await db.collection(COLLECTIONS.PARKING_LOTS).where('active', '==', true).get();

  return snap.docs.map(fromSnap);
}

async function findById(id, tx) {
  const ref = db.collection(COLLECTIONS.PARKING_LOTS).doc(id);
  const snap = await (tx ? tx.get(ref) : ref.get());

  return fromSnap(snap);
}

async function create(tx, id, data) {
  const ref = db.collection(COLLECTIONS.PARKING_LOTS).doc(id);

  await tx.create(ref, data);
}

export const parkingLotRepository = {
  listActive,
  findById,
  create,
};
