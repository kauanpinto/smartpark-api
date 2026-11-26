import { env } from '../config/env.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { telegramService } from './telegram.service.js';
import { RULES } from '../constants/index.js';

const dateFormatter = (date) =>
  date.toLocaleString('pt-BR', {
    timeZone: RULES.TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  });

function buildConfirmationText(reservation, lotName, spaceLabel) {
  return `
    Reserva confirmada!

    Código: ${reservation.id}
    Local: ${lotName}
    Vaga: ${spaceLabel}
    Período: ${dateFormatter.format(reservation.arrival_expected)} - ${dateFormatter.format(reservation.departure_expected)}
    Pagamento: Aprovado
  `;
}

function buildTicketText(ticket, lotName, spaceLabel) {
  return `
    SmartPark — Comprovante

    Ticket: ${ticket.id}
    Estacionamento: ${lotName}
    Vaga: ${spaceLabel}
    Chegada: ${dateFormatter.format(ticket.arrival_real)}
    Saída: ${dateFormatter.format(ticket.departure_real)}
    Duração: ${ticket.duration_minutes} min
    Valor final: R$ ${(ticket.final_amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    ${ticket.extra_amount_cents > 0 ? `Atraso: R$ ${(ticket.extra_amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
  `;
}

async function notify({ key, userId, type, text }) {
  const telegram = await userRepository.getTelegram(userId);
  const notificationData = {
    channel: 'telegram',
    type,
    chat_id: telegram?.telegram_chat_id ?? null,
    status: 'PENDING',
    attempts: 0,
    last_error: null,
    payload: text,
    create_at: new Date(),
    next_attemp_at: null,
  };
  const created = await notificationRepository.createIfAbsent(key, notificationData);

  if (!created) return;

  if (!telegram?.telegram_chat_id) {
    await notificationRepository.update(key, { status: 'NO_CHAT' });
    return;
  }

  const result = await telegramService.sendMessage(telegram.telegram_chat_id, text);

  if (result.ok) {
    await notificationRepository.update(key, { status: 'SENT', sent_at: new Date() });
    return;
  }

  await notificationRepository.update(key, {
    status: 'PENDING_RETRY',
    attemps: 1,
    last_error: result.error ?? 'unknown',
    next_attemp_at: new Date(Date.now() + 30000),
  });
}

async function alertOps(key, text) {
  const notificationData = {
    channel: 'telegram',
    type: 'OPS_ALERT',
    chat_id: Number(env.TELEGRAM_DEFAULT_CHAT_ID),
    status: 'PENDING',
    attempts: 0,
    last_error: null,
    sent_at: null,
    payload: text,
    created_at: new Date(),
    next_attempt_at: null,
  };

  const created = await notificationRepository.createIfAbsent(key, notificationData);

  if (!created) return;

  if (!env.TELEGRAM_DEFAULT_CHAT_ID) {
    await notificationRepository.update(key, { status: 'NO_CHAT' });
    return;
  }

  const result = await telegramService.sendMessage(Number(env.TELEGRAM_DEFAULT_CHAT_ID), text);

  if (result.ok) {
    await notificationRepository.update(key, { status: 'SENT', sent_at: new Date() });
    return;
  }

  await notificationRepository.update(key, {
    status: 'PENDING_RETRY',
    attemps: 1,
    last_error: result.error ?? 'unknown',
    next_attemp_at: new Date(Date.now() + 30000),
  });
}

export const notificationService = {
  notify,
  alertOps,
  buildConfirmationText,
  buildTicketText,
};
