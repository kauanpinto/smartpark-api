import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { reservationController } from '../controllers/reservation.controller.js';

const reservationRoutes = Router();

reservationRoutes.post('/api/reservations', requireAuth, reservationController.create);

export default reservationRoutes;
