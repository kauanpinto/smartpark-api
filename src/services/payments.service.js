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
  idempotencyKey,
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
        success_url: `${baseUrl}/checkout-success.html`,
        failure_url: `${baseUrl}/checkout-failure.html`,
        pending_url: `${baseUrl}/checkout-pending.html`,
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

async function getOrderStatus(orderId) {
  const order = new Order(client);

  try {
    const result = await order.get({ id: orderId });
    return result;
  } catch (error) {
    console.error(`[MercadoPago] Erro ao buscar order ${orderId}`, error);
    return null;
  }
}

export const paymentsService = {
  createCheckoutOrder,
  getOrderStatus,
};
