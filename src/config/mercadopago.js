import axios from 'axios';
import { env } from './env.js';

export const mpHttp = axios.create({
  baseURL: 'https://api.mercadopago.com',
  timeout: 8000,
  headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
});
