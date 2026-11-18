import { availabilityService } from './availability.service.js';
import { parkingLotRepository } from '../repositories/parking-lot.repository.js';

async function listPublic() {
  const lots = await parkingLotRepository.listActive();
  const now = new Date();
  const result = [];

  for (const lot of lots) {
    const freeSpaces = await availabilityService.findFreeSpaces(lot.id, now, now + 60000);

    result.push({
      id: lot.id,
      name: lot.name,
      address: lot.address,
      latitude: lot.latitude,
      longitude: lot.longitude,
      hourly_rate_cents: lot.hourly_rate_cents,
      opening_hours: lot.opening_hours,
      available_now: freeSpaces.length,
    });
  }

  return result;
}

export const parkingLotService = {
  listPublic,
};
