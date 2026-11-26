import { Router } from 'express';
import { iotController } from '../controllers/iot.controller.js';
import { requireDevice } from '../middlewares/device.middleware.js';
import rateLimit from 'express-rate-limit';

const telemetryLimit = rateLimit({
  windowMs: 60_000,
  limit: 6,
  keyGenerator: (req) => req.device?.id ?? 'unknown',
});

const iotRoutes = Router();

iotRoutes.post('/api/iot/access-request', requireDevice, iotController.accessRequest);
iotRoutes.post('/api/iot/telemetry', requireDevice, telemetryLimit, iotController.telemetry);

export default iotRoutes;
