import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS } from '../constants/index.js';

async function createIfAbsent(id, data) {
  const ref = db.collection(COLLECTIONS.NOTIFICATIONS).doc(id);

  try {
    await ref.create(data);
    return true;
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') {
      return false;
    }
    throw error;
  }
}

async function update(id, data) {
  await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).update(data);
}

async function listRetryable(now, limit) {
  const snap = await db
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where('status', '==', 'PENDING_RETRY')
    .where('next_attempt_at', '<=', now)
    .limit(limit)
    .get();

  return snap.docs.map(fromSnap);
}

export const notificationRepository = {
  createIfAbsent,
  update,
  listRetryable,
};
