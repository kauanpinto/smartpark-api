import { Router } from "express";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware.js";
import { reservationsController } from "../controllers/reservations.controller.js";

const reservationsRouter = Router();

reservationsRouter.post(
  "/reservations",
  firebaseAuth,
  reservationsController.createReservation,
);
reservationsRouter.get(
  "/reservations",
  firebaseAuth,
  reservationsController.getUserReservations,
);
reservationsRouter.post(
  "/reservations/:id/checkout",
  firebaseAuth,
  reservationsController.createCheckout,
);

export default reservationsRouter;
