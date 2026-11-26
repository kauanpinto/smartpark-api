import { Router } from 'express';
import { iotController } from '../controllers/iot.controller.js';
import { requireDevice } from '../middlewares/device.middleware.js';

const iotRoutes = Router();

iotRoutes.post('/api/iot/access-request', requireDevice, iotController.accessRequest);

export default iotRoutes;
