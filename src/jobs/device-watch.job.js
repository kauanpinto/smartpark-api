import { db } from '../config/firebase.js';
import { COLLECTIONS, RULES, JOB_INTERVALS_MS } from '../constants/index.js';
import { notificationService } from '../services/notification.service.js';

export async function runDeviceWatch() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - RULES.DEVICE_OFFLINE_MIN * 60000);
  const snap = await db
    .collection(COLLECTIONS.DEVICES)
    .where('last_seen', '<', cutoff)
    .where('offline_alerted', '==', false)
    .get();

  for (const doc of snap.docs) {
    try {
      const device = { id: doc.id, ...doc.data() };

      await db.collection(COLLECTIONS.DEVICES).doc(device.id).update({
        status: 'OFFLINE',
        offline_alerted: true,
        updated_at: now,
      });

      const lastSeenMs = device.last_seen?.toMillis?.() ?? now.getTime();
      await notificationService.alertOps(
        `${device.id}_OFFLINE_${lastSeenMs}`,
        `Dispositivo ${device.id} offline há mais de ${RULES.DEVICE_OFFLINE_MIN}min. Lote: ${device.parking_lot_id}.`,
      );
    } catch (error) {
      console.error('[deviceWatch]', doc.id, error);
    }
  }
}

export function startDeviceWatchJob() {
  const timer = setInterval(() => {
    runDeviceWatch().catch((error) => console.error('[deviceWatch.job]', error));
  }, JOB_INTERVALS_MS.DEVICE_WATCH);

  timer.unref();

  return timer;
}
