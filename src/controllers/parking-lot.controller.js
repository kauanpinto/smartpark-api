import { ZodError } from 'zod';
import { commonSchema } from '../schemas/common.schema.js';
import { parkingLotSchema } from '../schemas/parking-lot.schema.js';
import { parkingLotService } from '../services/parking-lot.service.js';
import { availabilityService } from '../services/availability.service.js';

const ERROR_STATUS = {
  PARKING_LOT_NOT_FOUND: 404,
  INVALID_PERIOD: 422,
  OUTSIDE_OPENING_HOURS: 422,
};

async function list(req, res) {
  try {
    const lots = await parkingLotService.listPublic();

    return res.status(200).json(lots);
  } catch (error) {
    console.error('[parkingLot.list]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

async function availability(req, res) {
  try {
    const { id } = commonSchema.idParamSchema.parse(req.params);
    const { from, to } = parkingLotSchema.availabilityQuerySchema.parse(req.query);
    const result = await availabilityService.getAvailability(id, from, to);

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

    console.error('[parkingLot.availability]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const parkingLotController = {
  list,
  availability,
};
