import { env } from "../config/env.js";

async function sendMessage(chatId, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) {
    return;
  }

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (error) {
    console.error("[Telegram] Falha ao enviar mensagem:", error);
  }
}

async function sendReservationConfirmed(reservation, lotName) {
  const text = `
    *RESERVA CONFIRMADA*
    
    *Estacionamento:* ${lotName}
    *Vaga:* ${reservation.space_id}
    *Chegada prevista:* ${new Date(reservation.arrival_expected.toDate()).toLocaleString("pt-BR")}
    *Valor:* R$ ${reservation.price_estimate.toFixed(2)}
    
    Apresente o ID da reserva no totem para entrar.
  `;
  
  await sendMessage(env.TELEGRAM_DEFAULT_CHAT_ID, text);
}

async function sendTicketNotification(ticket) {
  const text = `
    *SMARTPARK IoT — COMPROVANTE*
    
    *Ticket:* \`${ticket.id}\`
    *Estacionamento:* ${ticket.parking_lot_name}
    *Vaga:* ${ticket.space_id}
    *Chegada:* ${ticket.arrival_real_formatted}
    *Saída:* ${ticket.departure_real_formatted}
    *Duração:* ${ticket.duration_minutes} minutos
    *Valor Final:* R$ ${ticket.final_amount.toFixed(2)}
  `;
  
  await sendMessage(env.TELEGRAM_DEFAULT_CHAT_ID, text);
}

async function sendOperationalAlert(message) {
  const text = `
    *ALERTA OPERACIONAL*
    
    ${message}
  `;
  
  await sendMessage(env.TELEGRAM_DEFAULT_CHAT_ID, text);
}

export const messageService = {
  sendMessage,
  sendReservationConfirmed,
  sendTicketNotification,
  sendOperationalAlert,
};
