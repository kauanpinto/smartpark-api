import { iotSchema } from "../schemas/iot.schema.js";
import { iotService } from "../services/iot.service.js";

async function accessRequest(req, res, next) {
  try {
    const body = iotSchema.accessBodySchema.parse(req.body);
    const result = await iotService.authorizeAccess(body);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export const iotController = {
  accessRequest,
};
