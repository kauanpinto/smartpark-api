import { env } from '../config/env.js';
import { telegramHttp } from '../config/telegram.js';
import { telegramService } from '../services/telegram.service.js';

async function deleteWebhook() {
  await telegramHttp.post('/deleteWebhook', {}, { validateStatus: () => true });
}

async function getUpdates(offset) {
  const response = await telegramHttp.get('/getUpdates', {
    params: { offset, timeout: 30 },
    timeout: 35000,
    validateStatus: () => true,
  });

  if (!response.data?.ok) {
    console.error('[telegram.getUpdates]', response.data?.description);
    return [];
  }

  return response.data.result ?? [];
}

export async function startTelegramPolling() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log('[telegram] no token, skipping polling');
    return;
  }

  await deleteWebhook();

  let offset = 0;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    try {
      const updates = await getUpdates(offset);

      for (const update of updates) {
        await telegramService.handleUpdate(update);
        offset = update.update_id + 1;
      }
    } catch (error) {
      console.error('[telegram.polling]', error.message);
      await sleep(5000);
    }
  }
}
