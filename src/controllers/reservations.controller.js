import { reservationsSchema } from "../schemas/reservations.schema.js";
import { reservationsService } from "../services/reservations.service.js";

async function createReservation(req, res, next) {
  try {
    const body = reservationsSchema.createReservationBodySchema.parse(req.body);
    const reservation = await reservationsService.createReservation({
      userId: req.user.id,
      ...body,
    });
    
    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
}

async function createCheckout(req, res, next) {
  try {
    const result = await reservationsService.createCheckout({
      reservationId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email,
    });
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getUserReservations(req, res, next) {
  try {
    const list = await reservationsService.getUserReservations(req.user.id);
    
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export const reservationsController = {
  createReservation,
  createCheckout,
  getUserReservations,
};
