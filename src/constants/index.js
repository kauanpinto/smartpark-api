export const COL = Object.freeze({
  PARKING_LOTS: "parking_lots",
  SPACES: "spaces",
  RESERVATIONS: "reservations",
  PAYMENTS: "payments",
  ACCESS_EVENTS: "access_events",
  TICKETS: "tickets",
  DEVICES: "devices",
  NOTIFICATIONS: "notifications",
});

export const R_STATUS = Object.freeze({
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
});

export const EVENT_TYPE = Object.freeze({
  ENTRY: "ENTRY",
  EXIT: "EXIT",
});

export const EVENT_RESULT = Object.freeze({
  GRANTED: "GRANTED",
  DENIED: "DENIED",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
});