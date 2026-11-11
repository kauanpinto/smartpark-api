import { reservationsSchema } from "../schemas/reservations.schema.js";
import { reservationsService } from "../services/reservations.service.js";

async function createReservation(req, res, next) {
  try {
    const validatedData = reservationsSchema.createReservationSchema.parse(
      req.body,
    );
    const reservation = await reservationsService.createReservation({
      userId: req.user.id,
      ...validatedData,
    });

    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
}

async function createCheckout(req, res, next) {
  try {
    const { id } = req.params;

    const result = await reservationsService.createCheckout({
      reservationId: id,
      userId: req.user.id,
      userEmail: req.user.email,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export const reservationsController = {
  createReservation,
  createCheckout,
};
