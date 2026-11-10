import { reservationsSchema } from "../schemas/reservations.schema.js";
import { reservationsService } from "../services/reservations.service.js";

async function createReservation(req, res, next) {
  try {
    const validatedData = reservationsSchema.createReservationSchema.parse(req.body);
    const reservation = await reservationsService.createReservation({
      userId: req.user.id,
      ...validatedData,
    });

    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
}

export const reservationsController = {
  createReservation,
};
