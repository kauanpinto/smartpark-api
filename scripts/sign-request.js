import crypto from 'node:crypto';
import { env } from '../src/config/env.js';

const body = process.argv[2];
const deviceId = process.argv[3] ?? 'dev-centro-01';

if (!body) {
  console.error('Informe o body da requisição.');
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);
const manifest = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', env.DEVICE_SHARED_SECRET)
  .update(manifest)
  .digest('hex');

const curlCommand = `curl -X POST http://localhost:3000/api/iot/access-request \\
  -H "Content-Type: application/json" \\
  -H "x-device-id: ${deviceId}" \\
  -H "x-timestamp: ${timestamp}" \\
  -H "x-signature: ${signature}" \\
  -d ${body}`;

console.log('\nComando curl:\n');
console.log(curlCommand);
