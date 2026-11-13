import { iotSchema } from "../schemas/iot.schema.js";
import { iotService } from "../services/iot.service.js";
import { messageService } from "../services/message.service.js";
import { col } from "../db/index.js";

async function accessRequest(req, res, next) {
  try {
    const body = iotSchema.accessBodySchema.parse(req.body);
    const result = await iotService.authorizeAccess(body);

    if (result.authorized && result.ticket) {
      messageService
        .sendTicketNotification(result.ticket)
        .catch((err) => console.error("Erro Telegram Ticket:", err));
    }

    if (result.authorized && body.type === "ENTRY") {
      const resSnap = await col.reservations.doc(body.reservationId).get();
      if (resSnap.exists) {
        const lotSnap = await col.parkingLots
          .doc(resSnap.data().parking_lot_id)
          .get();
        const lotName = lotSnap.exists ? lotSnap.data().name : "SmartPark";

        messageService
          .sendEntryRegistered(resSnap.data(), lotName)
          .catch((err) => console.error("Erro Telegram Entrada:", err));
      }
    }

    if (!result.authorized && result.reason === "Reserva não confirmada") {
      messageService
        .sendOperationalAlert(
          `O dispositivo tentou abrir a cancela para a reserva ${body.reservationId}, mas o pagamento não estava aprovado.`,
        )
        .catch((err) => console.error("Erro Telegram Alerta:", err));
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
