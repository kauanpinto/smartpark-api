import { telegramService } from '../services/telegram.service.js';
import { RULES, JOB_INTERVALS_MS } from '../constants/index.js';
import { notificationService } from '../services/notification.service.js';
import { notificationRepository } from '../repositories/notification.repository.js';

export async function runRetry() {
  const now = new Date();
  const retryable = await notificationRepository.listRetryable(now, 10);

  for (const notification of retryable) {
    try {
      const result = await telegramService.sendMessage(notification.chat_id, notification.payload);

      if (result.ok) {
        await notificationRepository.update(notification.id, {
          status: 'SENT',
          sent_at: new Date(),
        });

        continue;
      }

      const attempts = (notification.attempts ?? 0) + 1;

      if (attempts >= RULES.NOTIFICATION_MAX_ATTEMPTS) {
        await notificationRepository.update(notification.id, {
          status: 'FAILED',
          attempts,
          last_error: result.error ?? 'unknown',
        });
        await notificationService.alertOps(
          `notification_failed_${notification.id}`,
          `Notificação falhou após ${attempts} tentativas. Key: ${notification.id}. Error: ${result.error}`,
        );

        continue;
      }

      const backoffMs = result.retryAfter
        ? result.retryAfter * 1000
        : 30000 * Math.pow(2, attempts);

      await notificationRepository.update(notification.id, {
        status: 'PENDING_RETRY',
        attempts,
        last_error: result.error ?? 'unknown',
        next_attempt_at: new Date(Date.now() + backoffMs),
      });
    } catch (error) {
      console.error('[notification.retry]', notification.id, error);
    }
  }
}

export async function startNotificationRetryJob() {
  const timer = setInterval(() => {
    runRetry().catch((error) => console.error('[notificationRetry.job]', error));
  }, JOB_INTERVALS_MS.NOTIFICATION_RETRY);

  timer.unref();

  return timer;
}
