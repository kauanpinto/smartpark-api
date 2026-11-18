import { Router } from 'express';
import healthRoutes from './health.routes.js';
import paymentRoutes from './payment.routes.js';
import parkingLotRoutes from './parking-lot.routes.js';
import reservationRoutes from './reservation.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(paymentRoutes);
router.use(parkingLotRoutes);
router.use(reservationRoutes);

export const routes = router;
