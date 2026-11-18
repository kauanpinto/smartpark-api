import { db } from '../config/firebase.js';
import { generateReservationCode } from '../utils/code.js';
import { pricingService } from '../services/pricing.service.js';
import { RESERVATION_STATUS, RULES } from '../constants/index.js';
import { availabilityService } from '../services/availability.service.js';
import { reservationRepository } from '../repositories/reservation.repository.js';

function toPublic(result, input) {
  return {
    id: result.code,
    parking_lot: { id: result.lot.id, name: result.lot.name },
    space_label: result.space.label,
    arrival_expected: input.arrival_expected.toISOString(),
    departure_expected: input.departure_expected.toISOString(),
    price_estimate_cents: result.price,
    status: result.status,
    expires_at: result.expiresAt.toISOString(),
  };
}

function toPublicFromReservation(reservation) {
  return {
    id: reservation.id,
    parking_lot_id: reservation.parking_lot_id,
    space_id: reservation.space_id,
    arrival_expected: reservation.arrival_expected.toISOString(),
    departure_expected: reservation.departure_expected.toISOString(),
    arrival_real: reservation.arrival_real?.toISOString() ?? null,
    departure_real: reservation.departure_real?.toISOString() ?? null,
    price_estimate_cents: reservation.price_estimate_cents,
    status: reservation.status,
    expires_at: reservation.expires_at?.toISOString() ?? null,
    created_at: reservation.created_at.toISOString(),
  };
}

async function create(uid, input) {
  const lot = await availabilityService.assertBookablePeriod(
    input.parking_lot_id,
    input.arrival_expected,
    input.departure_expected,
  );

  const result = await db.runTransaction(async (tx) => {
    const freeSpaces = await availabilityService.findFreeSpaces(
      lot.id,
      input.arrival_expected,
      input.departure_expected,
      tx,
    );

    if (freeSpaces.length === 0) {
      throw new Error('SPACE_UNAVAILABLE');
    }

    freeSpaces.sort((a, b) => a.label.localeCompare(b.label));

    const space = freeSpaces[0];
    const price = pricingService.estimate(
      lot.hourly_rate_cents,
      input.arrival_expected,
      input.departure_expected,
    );
    const code = generateReservationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RULES.RESERVATION_PENDING_TTL_MIN * 60000);

    await reservationRepository.create(tx, code, {
      user_id: uid,
      parking_lot_id: lot.id,
      space_id: space.id,
      arrival_expected: input.arrival_expected,
      departure_expected: input.departure_expected,
      status: RESERVATION_STATUS.PENDING_PAYMENT,
      price_estimate_cents: price,
      expires_at: expiresAt,
      arrival_real: null,
      departure_real: null,
      created_at: now,
      updated_at: now,
    });

    return { code, space, lot, price, expiresAt, status: RESERVATION_STATUS.PENDING_PAYMENT };
  });

  return toPublic(result, input);
}

async function getById(user, id) {
  const reservation = await reservationRepository.findById(id);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  const isOwner = reservation.user_id === user.uid;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  return toPublicFromReservation(reservation);
}

async function listByUser(uid, limit) {
  const reservations = await reservationRepository.listByUser(uid, limit);

  return reservations.map(toPublicFromReservation);
}

export const reservationService = {
  create,
  getById,
  listByUser,
};
