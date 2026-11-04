import { Router } from "express";
import { getAllParkingLots } from "../controllers/parkingLot.controller.js";

const apiRoutes = Router();

apiRoutes.get("/parking-lots", getAllParkingLots);

export default apiRoutes;
