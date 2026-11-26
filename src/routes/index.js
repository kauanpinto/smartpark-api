import { Router } from 'express';
import iotRoutes from './iot.routes.js';
import adminRoutes from './admin.routes.js';
import healthRoutes from './health.routes.js';
import paymentRoutes from './payment.routes.js';
import telegramRoutes from './telegram.routes.js';
import parkingLotRoutes from './parking-lot.routes.js';
import reservationRoutes from './reservation.routes.js';

const router = Router();

router.use(iotRoutes);
router.use(adminRoutes);
router.use(healthRoutes);
router.use(paymentRoutes);
router.use(telegramRoutes);
router.use(parkingLotRoutes);
router.use(reservationRoutes);

export const routes = router;
