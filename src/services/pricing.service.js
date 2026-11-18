import { minutesBetween } from '../utils/time.js';

function estimate(hourlyRateCents, from, to) {
  const minutes = minutesBetween(from, to);

  if (minutes <= 0) {
    throw new Error('INVALID_PERIOD');
  }

  return Math.ceil(minutes / 60) * hourlyRateCents;
}

function overstay(departureExpected, departureReal, hourlyRateCents) {
  const minutesOver = minutesBetween(departureExpected, departureReal);

  if (minutesOver <= 0) {
    return { extra_amount_cents: 0, extra_status: null };
  }

  return {
    extra_amount_cents: Math.ceil(minutesOver / 60) * hourlyRateCents,
    extra_status: 'PENDING',
  };
}

export const pricingService = {
  estimate,
  overstay,
};
