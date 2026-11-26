import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS } from '../constants/index.js';

async function findById(id, tx) {
  const ref = db.collection(COLLECTIONS.ACCESS_EVENTS).doc(id);
  const snap = await (tx ? tx.get(ref) : ref.get());

  return fromSnap(snap);
}

async function create(tx, id, data) {
  const ref = db.collection(COLLECTIONS.ACCESS_EVENTS).doc(id);

  await tx.create(ref, data);
}

export const iotRepository = {
  findById,
  create,
};
