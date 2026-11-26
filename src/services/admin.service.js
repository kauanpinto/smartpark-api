import { db } from '../config/firebase.js';
import { availabilityService } from './availability.service.js';
import { spaceRepository } from '../repositories/space.repository.js';
import { deviceRepository } from '../repositories/device.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { parkingLotRepository } from '../repositories/parking-lot.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';

function slugify(name) {
  return (
    'lot-' +
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

async function createLot(input) {
  const lotId = slugify(input.name);

  return await db.runTransaction(async (tx) => {
    const existing = await parkingLotRepository.findById(lotId, tx);

    if (existing) {
      throw new Error('LOT_ALREADY_EXISTS');
    }

    await parkingLotRepository.create(tx, lotId, {
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      hourly_rate_cents: input.hourly_rate_cents,
      opening_hours: input.opening_hours,
      active: true,
      created_at: new Date(),
    });

    for (let i = 1; i <= input.spaces_count; i++) {
      const label = `A-${String(i).padStart(2, '0')}`;
      const spaceId = `${lotId}-${label}`;

      await spaceRepository.create(tx, spaceId, {
        parking_lot_id: lotId,
        label,
        active: true,
        occupancy_state: 'FREE',
        created_at: new Date(),
      });
    }

    if (input.device_id) {
      await deviceRepository.create(tx, input.device_id, {
        parking_lot_id: lotId,
        last_seen: null,
        status: 'OFFLINE',
        firmware_version: null,
        offline_alerted: false,
        created_at: new Date(),
      });
    }

    return { lotId, spacesCreated: input.spaces_count, deviceCreated: !!input.device_id };
  });
}

async function dashboard() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lots = await parkingLotRepository.listActive();
  const lotsWithStats = [];

  for (const lot of lots) {
    const spaces = await spaceRepository.listActiveByLot(lot.id);
    const occupiedNow = spaces.filter((space) => space.occupancy_state === 'OCCUPIED').length;
    const freeSpaces = await availabilityService.findFreeSpaces(
      lot.id,
      now,
      new Date(now.getTime() + 60000),
    );
    const reservationsToday = await reservationRepository.countByLotSince(lot.id, last24h);
    const pending = await reservationRepository.listPendingByLot(lot.id);
    const pendingValid = pending.filter((reservation) => reservation.expires_at > now).length;

    lotsWithStats.push({
      id: lot.id,
      name: lot.name,
      total_spaces: spaces.length,
      occupied_now: occupiedNow,
      available_now: freeSpaces.length,
      reservations_today: reservationsToday,
      pending_reservations: pendingValid,
    });
  }

  const devices = await deviceRepository.listAll();
  const notifFailed = await notificationRepository.listByStatus('FAILED', 20);
  const notifRetry = await notificationRepository.listByStatus('PENDING_RETRY', 20);
  const paymentsNeedsRefund = await paymentRepository.listByStatus('NEEDS_REFUND', 20);

  return {
    lots: lotsWithStats,
    devices: devices.map((d) => ({
      id: d.id,
      parking_lot_id: d.parking_lot_id,
      status: d.status,
      last_seen: d.last_seen,
    })),
    alerts: {
      notifications_failed: notifFailed,
      notifications_retry: notifRetry,
      payments_needs_refund: paymentsNeedsRefund,
    },
  };
}

export const adminService = {
  createLot,
  dashboard,
};
