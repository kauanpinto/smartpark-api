import { ZodError } from 'zod';
import { adminSchema } from '../schemas/admin.schema.js';
import { adminService } from '../services/admin.service.js';

const ERROR_STATUS = {
  LOT_ALREADY_EXISTS: 409,
  DEVICE_ALREADY_EXISTS: 409,
};

async function create(req, res) {
  try {
    const input = adminSchema.createLotSchema.parse(req.body);
    const result = await adminService.createLot(input);

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

    console.error('[admin.create]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

async function dashboard(req, res) {
  try {
    const result = await adminService.dashboard();

    return res.status(200).json(result);
  } catch (error) {
    console.error('[admin.dashboard]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const adminController = {
  create,
  dashboard,
};
