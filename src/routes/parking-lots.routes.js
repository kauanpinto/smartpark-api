import { Router } from "express";
import { parkingLotsController } from "../controllers/parking-lots.controller.js";

const parkingLotsRouter = Router();

parkingLotsRouter.get("/parking-lots", parkingLotsController.getAllParkingLots);

export default parkingLotsRouter;
