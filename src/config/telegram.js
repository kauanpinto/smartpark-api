import axios from 'axios';
import { env } from './env.js';

export const telegramHttp = axios.create({
  baseURL: `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`,
  timeout: 10000,
});
