import { reservationsService } from "../services/reservations.service.js";
import { paymentsService } from "../services/payments.service.js";

async function mercadopago(req, res, next) {
  try {
    const payload = JSON.parse(req.body.toString("utf-8"));

    if (payload.type !== "order" || payload.action !== "order.processed") {
      return res.status(200).send("Ignorado");
    }

    const orderId = payload.data.id;
    const mpOrder = await paymentsService.getOrderStatus(orderId);
    
    if (!mpOrder) {
      return res.status(200).send("Order não encontrada");
    }

    if (
      mpOrder.status === "processed" &&
      mpOrder.status_detail === "accredited"
    ) {
      const reservationId = mpOrder.external_reference;

      await reservationsService.confirmPayment({
        reservationId,
        paymentId: mpOrder.id,
      });
    }

    return res.status(200).send("OK");
  } catch (err) {
    next(err);
  }
}

export const webhooksController = {
  mercadopago,
};
