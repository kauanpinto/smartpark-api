import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { telegramController } from '../controllers/telegram.controller.js';

const telegramRoutes = Router();

telegramRoutes.post('/api/telegram/link-code', requireAuth, telegramController.createLinkCode);
telegramRoutes.get('/api/me', requireAuth, telegramController.me);

export default telegramRoutes;
