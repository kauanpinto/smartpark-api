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

async function recordTelemetry(deviceId, data) {
  await db
    .collection(COLLECTIONS.DEVICES)
    .doc(deviceId)
    .update({
      last_seen: new Date(),
      status: data.state === 'MANUTENCAO' ? 'MAINTENANCE' : 'ONLINE',
      firmware_version: data.firmware_version,
      rssi: data.rssi,
      uptime_s: data.uptime_s,
      offline_alerted: false,
      updated_at: new Date(),
    });
}

export const deviceRepository = {
  update,
  findById,
  recordTelemetry,
};
