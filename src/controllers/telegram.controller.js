import { userRepository } from '../repositories/user.repository.js';
import { telegramService } from '../services/telegram.service.js';

async function createLinkCode(req, res) {
  try {
    const result = await telegramService.createLinkCodeForUser(req.user.uid);

    return res.json(result);
  } catch (error) {
    console.error('[telegram.createLinkCode]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

async function me(req, res) {
  try {
    const telegram = await userRepository.getTelegram(req.user.uid);

    return res.json({
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      telegram_linked: !!telegram?.telegram_chat_id,
    });
  } catch (error) {
    console.error('[telegram.me]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const telegramController = {
  createLinkCode,
  me,
};
