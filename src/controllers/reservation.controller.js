import { ZodError } from 'zod';
import { reservationSchema } from '../schemas/reservation.schema.js';
import { reservationService } from '../services/reservation.service.js';

const ERROR_STATUS = {
  PARKING_LOT_NOT_FOUND: 404,
  INVALID_PERIOD: 422,
  OUTSIDE_OPENING_HOURS: 422,
  SPACE_UNAVAILABLE: 409,
};

async function create(req, res) {
  try {
    const data = reservationSchema.createReservationSchema.parse(req.body);
    const result = await reservationService.create(req.user.uid, data);

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const status = ERROR_STATUS[error.message];

    if (status) {
      return res.status(status).json({ error: error.message });
    }

    console.error('[reservation.create]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const reservationController = {
  create,
};
