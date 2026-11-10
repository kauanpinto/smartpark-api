import { Router } from "express";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware.js";
import { reservationsController } from "../controllers/reservations.controller.js";

const reservationsRouter = Router();

reservationsRouter.post(
  "/reservations",
  firebaseAuth,
  reservationsController.createReservation,
);

export default reservationsRouter;
