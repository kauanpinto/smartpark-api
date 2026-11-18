import { minutesBetween } from '../utils/time.js';

function estimate(hourlyRateCents, from, to) {
  const minutes = minutesBetween(from, to);

  if (minutes <= 0) {
    throw new Error('INVALID_PERIOD');
  }

  return Math.ceil(minutes / 60) * hourlyRateCents;
}

export const pricingService = {
  estimate,
};
