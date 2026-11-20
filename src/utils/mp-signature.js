import { env } from '../config/env.js';
import { hmacHex, safeEqualHex } from './hmac.js';

export function verifyMpSignature({ headers, query }) {
  const signature = headers['x-signature'];
  const requestId = headers['x-request-id'];

  if (!signature || !requestId) return false;

  const parts = {};

  for (const chunk of signature.split(',')) {
    const [key, value] = chunk.split('=');

    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  }

  const { ts, v1 } = parts;

  if (!ts || !v1) return false;

  const dataId = query['data.id'] ?? query.id;

  if (!dataId) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = hmacHex(env.MERCADOPAGO_WEBHOOK_SECRET, manifest);

  return safeEqualHex(expected, v1);
}
