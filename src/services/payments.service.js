import { MercadoPagoConfig, Order } from "mercadopago";
import { env } from "../config/env.js";

const client = new MercadoPagoConfig({
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
});

async function createCheckoutOrder({
  reservationId,
  title,
  amount,
  payerEmail,
  baseUrl,
  idempotencyKey
}) {
  const order = new Order(client);

  const body = {
    type: "online",
    processing_mode: "manual",
    total_amount: amount.toFixed(2),
    external_reference: reservationId,
    payer: {
      email: payerEmail,
    },
    items: [
      {
        title: title,
        unit_price: amount.toFixed(2),
        quantity: 1,
      },
    ],
    config: {
      online: {
        success_url: `${baseUrl}/checkout/success`,
        failure_url: `${baseUrl}/checkout/failure`,
        pending_url: `${baseUrl}/checkout/pending`,
        auto_return: "approved",
      },
    },
  };

  const result = await order.create({
    body,
    requestOptions: { idempotencyKey: idempotencyKey },
  });

  return result;
}

export const paymentsService = {
  createCheckoutOrder,
};
