import { Router } from 'express';
import { parkingLotController } from '../controllers/parking-lot.controller.js';

const parkingLotRoutes = Router();

parkingLotRoutes.get('/api/parking-lots', parkingLotController.list);
parkingLotRoutes.get('/api/parking-lots/:id/availability', parkingLotController.availability);

export default parkingLotRoutes;
