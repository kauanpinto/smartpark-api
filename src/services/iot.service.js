import { db } from '../config/firebase.js';
import { deviceService } from './device.service.js';
import { pricingService } from './pricing.service.js';
import { notificationService } from './notification.service.js';
import { RESERVATION_STATUS, RULES } from '../constants/index.js';
import { iotRepository } from '../repositories/iot.repository.js';
import { spaceRepository } from '../repositories/space.repository.js';
import { deviceRepository } from '../repositories/device.repository.js';
import { ticketRepository } from '../repositories/ticket.repository.js';
import { parkingLotRepository } from '../repositories/parking-lot.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';

async function requestAccess(device, input) {
  const result = await db.runTransaction(async (tx) => {
    const now = new Date();
    const eventDocId = `${device.id}_${input.event_id}`;
    const existing = await iotRepository.findById(eventDocId, tx);

    if (existing) {
      return {
        allowed: existing.result === 'ALLOWED',
        code: existing.result === 'ALLOWED' ? 'OK' : 'DENIED',
      };
    }

    const deny = async (reason) => {
      await iotRepository.create(tx, eventDocId, {
        device_id: device.id,
        parking_lot_id: device.parking_lot_id,
        reservation_code: input.reservation_code,
        type: input.type,
        result: 'DENIED',
        reason,
        timestamp: now,
      });

      return {
        allowed: false,
        code: 'DENIED',
      };
    };

    if (!['ENTRY', 'EXIT'].includes(input.type)) {
      return deny('INVALID_TYPE');
    }

    const reservation = await reservationRepository.findById(input.reservation_code, tx);

    if (!reservation) {
      return deny('NOT_FOUND');
    }

    if (reservation.parking_lot_id !== device.parking_lot_id) {
      return deny('WRONG_LOT');
    }

    if (reservation.status === RESERVATION_STATUS.PENDING_PAYMENT) {
      return deny('NOT_PAID');
    }

    if (
      [
        RESERVATION_STATUS.EXPIRED,
        RESERVATION_STATUS.CANCELLED,
        RESERVATION_STATUS.COMPLETED,
      ].includes(reservation.status)
    ) {
      return deny('INVALID_STATE');
    }

    if (input.type === 'ENTRY') {
      if (reservation.status === RESERVATION_STATUS.CHECKED_IN) {
        return deny('ALREADY_INSIDE');
      }

      const expectedArrival = reservation.arrival_expected;
      const minArrival = new Date(expectedArrival.getTime() - RULES.ENTRY_EARLY_MIN * 60_000);
      const maxArrival = new Date(expectedArrival.getTime() + RULES.ENTRY_LATE_MIN * 60_000);

      if (now < minArrival || now > maxArrival) {
        return deny('OUT_OF_WINDOW');
      }

      await reservationRepository.update(tx, reservation.id, {
        status: RESERVATION_STATUS.CHECKED_IN,
        arrival_real: now,
        updated_at: now,
      });

      await spaceRepository.update(tx, reservation.space_id, {
        occupancy_state: 'OCCUPIED',
        updated_at: now,
      });

      await iotRepository.create(tx, eventDocId, {
        device_id: device.id,
        parking_lot_id: device.parking_lot_id,
        reservation_code: input.reservation_code,
        type: 'ENTRY',
        result: 'ALLOWED',
        reason: 'OK',
        timestamp: now,
      });

      await deviceRepository.update(tx, device.id, {
        last_seen: now,
      });

      return {
        allowed: true,
        code: 'OK',
      };
    }

    if (reservation.status !== RESERVATION_STATUS.CHECKED_IN) {
      return deny('NOT_INSIDE');
    }

    const lot = await parkingLotRepository.findById(reservation.parking_lot_id, tx);
    const departureReal = now;
    const durationMinutes = Math.max(
      0,
      Math.floor((departureReal.getTime() - reservation.arrival_real.getTime()) / 60_000),
    );

    const extra = pricingService.overstay(
      reservation.departure_expected,
      departureReal,
      lot.hourly_rate_cents,
    );

    await reservationRepository.update(tx, reservation.id, {
      status: RESERVATION_STATUS.COMPLETED,
      departure_real: departureReal,
      updated_at: now,
    });

    await spaceRepository.update(tx, reservation.space_id, {
      occupancy_state: 'FREE',
      updated_at: now,
    });

    await ticketRepository.create(tx, reservation.id, {
      ticket_id: `BA-${reservation.id}`,
      reservation_id: reservation.id,
      arrival_real: reservation.arrival_real,
      departure_real: departureReal,
      duration_minutes: durationMinutes,
      final_amount_cents: reservation.price_estimate_cents,
      extra_amount_cents: extra.extra_amount_cents,
      extra_status: extra.extra_status,
      payment_status: 'PAID',
      telegram_status: 'PENDING',
      created_at: now,
    });

    await iotRepository.create(tx, eventDocId, {
      device_id: device.id,
      parking_lot_id: device.parking_lot_id,
      reservation_code: input.reservation_code,
      type: 'EXIT',
      result: 'ALLOWED',
      reason: 'OK',
      timestamp: now,
    });

    await deviceRepository.update(tx, device.id, {
      last_seen: now,
    });

    return {
      allowed: true,
      code: 'OK',
      ticket: {
        reservationId: reservation.id,
        duration: durationMinutes,
        finalAmount: reservation.price_estimate_cents,
        extra: extra.extra_amount_cents,
        arrivalReal: reservation.arrival_real,
        departureReal,
      },
    };
  });

  if (result.ticket) {
    try {
      const reservation = await reservationRepository.findById(result.ticket.reservationId);
      const lot = await parkingLotRepository.findById(reservation.parking_lot_id);

      await notificationService.notify({
        key: `${result.ticket.reservationId}_TICKET_FINAL`,
        userId: reservation.user_id,
        type: 'TICKET_FINAL',
        text: notificationService.buildTicketText(result.ticket, lot.name, reservation.space_id),
      });
    } catch (error) {
      console.error('[access.notifyTicket]', error);
    }
  }

  return {
    allowed: result.allowed,
    code: result.code,
  };
}

async function sendTelemetry(device, data) {
  await deviceService.recordTelemetry(device.id, data);

  return { received: true };
}

export const iotService = {
  requestAccess,
  sendTelemetry,
};
