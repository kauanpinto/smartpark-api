import app from './app.js';
import { env } from './config/env.js';
import { startExpirationJob } from './jobs/expiration.job.js';

const server = app.listen(env.PORT, () => console.log(`[server] listening on port ${env.PORT}`));

startExpirationJob();

function shutdown(signal) {
  console.log(`[server] ${signal} received, closing...`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
