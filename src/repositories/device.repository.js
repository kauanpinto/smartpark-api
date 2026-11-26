import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../constants/index.js';
import { fromSnap } from '../utils/firestore.js';

async function update(tx, id, data) {
  const ref = db.collection(COLLECTIONS.DEVICES).doc(id);

  await tx.update(ref, data);
}

async function findById(id, tx) {
  const ref = db.collection(COLLECTIONS.DEVICES).doc(id);
  const snap = await (tx ? tx.get(ref) : ref.get());

  return fromSnap(snap);
}

export const deviceRepository = {
  update,
  findById,
};
