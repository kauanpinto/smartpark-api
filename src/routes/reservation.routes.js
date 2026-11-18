import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { reservationController } from '../controllers/reservation.controller.js';

const reservationRoutes = Router();

reservationRoutes.post('/api/reservations', requireAuth, reservationController.create);
reservationRoutes.get('/api/reservations', requireAuth, reservationController.list);
reservationRoutes.get('/api/reservations/:id', requireAuth, reservationController.getById);

export default reservationRoutes;
