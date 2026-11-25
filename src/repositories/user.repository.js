import { db } from '../config/firebase.js';
import { fromSnap } from '../utils/firestore.js';
import { COLLECTIONS, RULES } from '../constants/index.js';
import { generateReservationCode } from '../utils/code.js';

async function getTelegram(uid) {
  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  const user = fromSnap(snap);

  if (!user) return null;

  return {
    telegram_chat_id: user.telegram_chat_id ?? null,
    telegram_linked_at: user.telegram_linked_at ?? null,
  };
}

async function setTelegram(uid, chatId) {
  const ref = db.collection(COLLECTIONS.USERS).doc(uid);

  await ref.set(
    {
      telegram_chat_id: chatId,
      telegram_linked_at: new Date(),
    },
    { merge: true },
  );
}

async function createLinkCode(uid) {
  const code = generateReservationCode();
  const expiresAt = new Date(Date.now() + RULES.TELEGRAM_TTL_MIN * 60000);

  await db.collection(COLLECTIONS.TELEGRAM_LINK_CODES).doc(code).set({
    uid,
    expires_at: expiresAt,
    used: false,
    created_at: new Date(),
  });

  return code;
}

async function consumeLinkCode(code) {
  return await db.runTransaction(async (tx) => {
    const ref = db.collection(COLLECTIONS.TELEGRAM_LINK_CODES).doc(code);
    const snap = await tx.get(ref);

    if (!snap.exists) return null;

    const data = snap.data();

    if (data.used) return null;

    if (data.expires_at.toDate() <= new Date()) return null;

    tx.update(ref, { used: true, used_at: new Date() });

    return data.uid;
  });
}

export const userRepository = {
  getTelegram,
  setTelegram,
  createLinkCode,
  consumeLinkCode,
};
