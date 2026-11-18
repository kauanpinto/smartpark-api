import { RULES } from '../constants/index.js';

export function minutesBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / 60000);
}

export function addMinutes(date, n) {
  return new Date(date.getTime() + n * 60000);
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: RULES.TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: RULES.TIMEZONE,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
});

export function isWithinOpeningHours(from, to, { open, close }) {
  if (close <= open) return false;

  const fromDay = dayFormatter.format(from);
  const fromTime = timeFormatter.format(from);
  const toDay = dayFormatter.format(to);
  const toTime = timeFormatter.format(to);

  if (fromDay !== toDay) return false;

  return fromTime >= open && toTime <= close;
}
