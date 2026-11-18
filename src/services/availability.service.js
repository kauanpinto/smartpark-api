import { pricingService } from './pricing.service.js';
import { RESERVATION_STATUS, RULES } from '../constants/index.js';
import { spaceRepository } from '../repositories/space.repository.js';
import { isWithinOpeningHours, minutesBetween } from '../utils/time.js';
import { parkingLotRepository } from '../repositories/parking-lot.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';

async function assertBookablePeriod(lotId, from, to) {
  const lot = await parkingLotRepository.findById(lotId);

  if (!lot || !lot.active) {
    throw new Error('PARKING_LOT_NOT_FOUND');
  }

  const minutes = minutesBetween(from, to);
  const now = new Date();

  if (minutes <= 0 || minutes > RULES.MAX_RESERVATION_HOURS * 60 || from < now - 60000) {
    throw new Error('INVALID_PERIOD');
  }

  if (!isWithinOpeningHours(from, to, lot.opening_hours)) {
    throw new Error('OUTSIDE_OPENING_HOURS');
  }

  return lot;
}

async function findFreeSpaces(lotId, from, to, tx) {
  const spaces = await spaceRepository.listActiveByLot(lotId, tx);
  const blocking = await reservationRepository.listBlockingByLot(lotId, tx);
  const now = new Date();
  const occupiedSpaceIds = new Set();

  for (const reservation of blocking) {
    if (
      reservation.status === RESERVATION_STATUS.PENDING_PAYMENT &&
      reservation.expires_at <= now
    ) {
      continue;
    }

    const effectiveEnd =
      reservation.status === RESERVATION_STATUS.CHECKED_IN
        ? new Date(Math.max(reservation.departure_expected.getTime(), now.getTime()))
        : reservation.departure_expected;

    const overlap = reservation.arrival_expected < to && effectiveEnd > from;

    if (overlap) {
      occupiedSpaceIds.add(reservation.space_id);
    }
  }

  return spaces.filter((space) => !occupiedSpaceIds.has(space.id));
}

async function getAvailability(lotId, from, to) {
  const lot = await assertBookablePeriod(lotId, from, to);
  const spaces = await spaceRepository.listActiveByLot(lotId);
  const freeSpaces = await findFreeSpaces(lotId, from, to);
  const priceEstimateCents = pricingService.estimate(lot.hourly_rate_cents, from, to);

  return {
    total: spaces.length,
    available: freeSpaces.length,
    price_estimate_cents: priceEstimateCents,
  };
}

export const availabilityService = {
  findFreeSpaces,
  getAvailability,
  assertBookablePeriod,
};
