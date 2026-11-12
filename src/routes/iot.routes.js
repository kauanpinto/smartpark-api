import { Router } from "express";
import { deviceAuth } from "../middlewares/device-auth.middleware.js";
import { iotController } from "../controllers/iot.controller.js";

const iotRouter = Router();

iotRouter.post("/iot/access-request", deviceAuth, iotController.accessRequest);

export default iotRouter;
