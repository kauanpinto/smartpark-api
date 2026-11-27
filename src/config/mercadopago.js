import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { env } from './env.js';

const mpClient = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 8000 },
});

export const mpPreference = new Preference(mpClient);
export const mpPaymentClient = new Payment(mpClient);
