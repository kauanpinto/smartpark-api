import { ZodError } from 'zod';
import { iotSchema } from '../schemas/iot.schema.js';
import { iotService } from '../services/iot.service.js';

async function accessRequest(req, res) {
  try {
    const input = iotSchema.accessRequestSchema.parse(req.body);
    const result = await iotService.requestAccess(req.device, input);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.issues });
    }

    console.error('[iot.accessRequest]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export const iotController = {
  accessRequest,
};
