import { Router } from 'express';
import healthRoutes from './health.routes.js';
import parkingLotRoutes from './parking-lot.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(parkingLotRoutes);

export const routes = router;
