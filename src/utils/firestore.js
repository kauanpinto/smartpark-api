import { Timestamp } from 'firebase-admin/firestore';

export function fromSnap(snap) {
  if (!snap.exists) return null;

  const data = snap.data();

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      data[key] = value.toDate();
    }
  }

  return { id: snap.id, ...data };
}

export function toTimestamp(date) {
  return Timestamp.fromDate(date);
}
