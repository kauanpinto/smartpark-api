import { ZodError } from 'zod';
import { commonSchema } from '../schemas/common.schema.js';
import { paymentService } from '../services/payment.service.js';

const ERROR_STATUS = {
  RESERVATION_NOT_FOUND: 404,
  INVALID_STATE: 409,
  RESERVATION_EXPIRED: 409,
  MERCADOPAGO_ERROR: 502,
  MERCADOPAGO_TIMEOUT: 503,
};

async function createCheckout(req, res) {
  try {
    const { id } = commonSchema.idParamSchema.parse(req.params);
    const result = await paymentService.createCheckout(req.user.uid, id);

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

    console.error('[payment.createCheckout]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const paymentController = {
  createCheckout,
};
