import { db } from '../config/firebase.js';
import { RESERVATION_STATUS, RULES } from '../constants/index.js';
import { iotRepository } from '../repositories/iot.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';
import { spaceRepository } from '../repositories/space.repository.js';
import { deviceRepository } from '../repositories/device.repository.js'; // 👈 Adicionado

async function requestAccess(device, input) {
  return db.runTransaction(async (tx) => {
    const now = new Date();
    const eventDocId = `${device.id}_${input.event_id}`;
    const existing = await iotRepository.findById(eventDocId, tx);

    if (existing) {
      return {
        allowed: existing.result === 'ALLOWED',
        code: existing.result === 'ALLOWED' ? 'OK' : 'DENIED',
      };
    }

    const reservation = await reservationRepository.findById(input.reservation_code, tx);

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

    if (!reservation) {
      return deny('NOT_FOUND');
    }

    if (reservation.parking_lot_id !== device.parking_lot_id) {
      return deny('WRONG_LOT');
    }

    if (reservation.status === RESERVATION_STATUS.PENDING_PAYMENT) {
      return deny('NOT_PAID');
    }

    if (reservation.status === RESERVATION_STATUS.CHECKED_IN) {
      return deny('ALREADY_INSIDE');
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

    const expectedArrival = reservation.arrival_expected;
    const minArrival = new Date(expectedArrival.getTime() - RULES.ENTRY_EARLY_MIN * 60 * 1000);
    const maxArrival = new Date(expectedArrival.getTime() + RULES.ENTRY_LATE_MIN * 60 * 1000);

    if (now < minArrival || now > maxArrival) {
      return deny('OUT_OF_WINDOW');
    }

    if (input.type !== 'ENTRY') {
      return deny('INVALID_TYPE');
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
      type: input.type,
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
  });
}

export const iotService = {
  requestAccess,
};
