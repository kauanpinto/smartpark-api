import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { hmacHex, safeEqualHex } from '../utils/hmac.js';
import { RULES, COLLECTIONS } from '../constants/index.js';

export async function requireDevice(req, res, next) {
  const deviceId = req.headers['x-device-id'];
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  if (!deviceId || !timestamp || !signature) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const nowS = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);

  if (!Number.isFinite(ts)) {
    return res.status(401).json({ error: 'INVALID_TIMESTAMP' });
  }

  if (Math.abs(nowS - ts) > RULES.DEVICE_SIGNATURE_WINDOW_S) {
    return res.status(401).json({ error: 'REPLAY_WINDOW_EXPIRED' });
  }

  const payload = `${timestamp}.${req.rawBody ?? ''}`;
  const expected = hmacHex(env.DEVICE_SHARED_SECRET, payload);

  if (!safeEqualHex(expected, signature)) {
    return res.status(401).json({ error: 'INVALID_SIGNATURE' });
  }

  const deviceSnap = await db.collection(COLLECTIONS.DEVICES).doc(deviceId).get();

  if (!deviceSnap.exists) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  req.device = {
    id: deviceId,
    parking_lot_id: deviceSnap.data().parking_lot_id,
  };

  return next();
}
