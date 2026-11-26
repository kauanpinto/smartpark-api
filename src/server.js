import app from './app.js';
import { env } from './config/env.js';
import { startExpirationJob } from './jobs/expiration.job.js';
import { startTelegramPolling } from './jobs/telegram-polling.job.js';
import { startNotificationRetryJob } from './jobs/notification-retry.job.js';

const server = app.listen(env.PORT, () => console.log(`[server] listening on port ${env.PORT}`));

startExpirationJob();

startTelegramPolling().catch((error) => {
  console.error('[telegram] fatal:', error);
});

startNotificationRetryJob();

function shutdown(signal) {
  console.log(`[server] ${signal} received, closing...`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
