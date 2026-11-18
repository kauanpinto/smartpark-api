import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { paymentController } from '../controllers/payment.controller.js';

const paymentRoutes = Router();

paymentRoutes.post('/api/reservations/:id/checkout', requireAuth, paymentController.createCheckout);

export default paymentRoutes;
