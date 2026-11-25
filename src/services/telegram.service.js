import { env } from '../config/env.js';
import { telegramHttp } from '../config/telegram.js';
import { userRepository } from '../repositories/user.repository.js';

async function sendMessage(chatId, text) {
  try {
    const response = await telegramHttp.post(
      '/sendMessage',
      { chat_id: chatId, text },
      { validateStatus: () => true },
    );

    return {
      ok: response.data?.ok === true,
      retryAfter: response.data?.parameters?.retry_after,
      error: response.data?.description,
    };
  } catch (error) {
    console.error('[telegram.sendMessage]', error.message);
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

async function createLinkCodeForUser(uid) {
  const code = await userRepository.createLinkCode(uid);
  const deep_link = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}`;

  return { code, deep_link };
}

async function handleUpdate(update) {
  const message = update.message;

  if (!message?.text) return;

  const text = message.text.trim();

  if (!text.startsWith('/start')) return;

  const parts = text.split(/\s+/);
  const code = parts[1];

  if (!code) {
    await sendMessage(message.chat.id, 'Use o link gerado no site para vincular sua conta.');
    return;
  }

  const uid = await userRepository.consumeLinkCode(code);

  if (!uid) {
    await sendMessage(message.chat.id, 'Código inválido ou expirado. Gere outro no site.');
    return;
  }

  await userRepository.setTelegram(uid, message.chat.id);
  await sendMessage(message.chat.id, 'Conta vinculada! Você receberá notificações aqui.');
}

export const telegramService = {
  sendMessage,
  createLinkCodeForUser,
  handleUpdate,
};
