import { ZodError } from 'zod';
import { commonSchema } from '../schemas/common.schema.js';
import { reservationSchema } from '../schemas/reservation.schema.js';
import { reservationService } from '../services/reservation.service.js';

const ERROR_STATUS = {
  PARKING_LOT_NOT_FOUND: 404,
  RESERVATION_NOT_FOUND: 404,
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

async function getById(req, res) {
  try {
    const { id } = commonSchema.idParamSchema.parse(req.params);
    const result = await reservationService.getById(req.user, id);

    return res.status(200).json(result);
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

    console.error('[reservation.getById]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

async function list(req, res) {
  try {
    const { limit } = reservationSchema.listReservationsQuerySchema.parse(req.query);
    const result = await reservationService.listByUser(req.user.uid, limit);

    return res.status(200).json(result);
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

    console.error('[reservation.list]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const reservationController = {
  create,
  getById,
  list,
};
