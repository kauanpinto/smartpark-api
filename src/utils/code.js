import crypto from 'node:crypto';

export function generateReservationCode() {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  let code = 'BA';

  for (let i = 0; i < 8; i++) {
    code += alphanumeric[crypto.randomInt(0, alphanumeric.length)];
  }

  return code;
}
