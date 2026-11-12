import { iotSchema } from "../schemas/iot.schema.js";
import { iotService } from "../services/iot.service.js";
import { messageService } from "../services/message.service.js";

async function accessRequest(req, res, next) {
  try {
    const body = iotSchema.accessBodySchema.parse(req.body);
    const result = await iotService.authorizeAccess(body);

    if (result.authorized && result.ticket) {
      messageService
        .sendTicketNotification(result.ticket)
        .catch((err) => console.error("Erro no Telegram:", err));
    }

    res.status(200).json({
      authorized: result.authorized,
      reason: result.reason,
    });
  } catch (err) {
    next(err);
  }
}

export const iotController = {
  accessRequest,
};
