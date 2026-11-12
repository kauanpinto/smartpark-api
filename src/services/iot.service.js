import { db, FieldValue } from "../config/firebase.js";
import { col } from "../db/index.js";
import { R_STATUS, EVENT_TYPE, EVENT_RESULT } from "../constants/index.js";

const TOLERANCE_BEFORE_MS = 15 * 60 * 1000;
const TOLERANCE_AFTER_MS = 30 * 60 * 1000;

async function authorizeAccess({ eventId, reservationId, type }) {
  return db.runTransaction(async (tx) => {
    const eventRef = col.accessEvents.doc(eventId);
    const eventSnap = await tx.get(eventRef);

    if (eventSnap.exists) {
      const prevEvent = eventSnap.data();
      return {
        authorized: prevEvent.result === EVENT_RESULT.GRANTED,
        reason: prevEvent.reason || "Evento já processado",
      };
    }

    const resRef = col.reservations.doc(reservationId);
    const resSnap = await tx.get(resRef);

    if (!resSnap.exists) {
      tx.set(eventRef, {
        event_id: eventId,
        reservation_id: reservationId,
        type,
        result: EVENT_RESULT.DENIED,
        reason: "Reserva não encontrada",
        timestamp: FieldValue.serverTimestamp(),
      });
      return { authorized: false, reason: "Reserva não encontrada" };
    }

    const reservation = resSnap.data();
    const now = new Date();

    if (type === EVENT_TYPE.ENTRY) {
      if (reservation.status !== R_STATUS.CONFIRMED) {
        tx.set(eventRef, {
          event_id: eventId,
          reservation_id: reservationId,
          type,
          result: EVENT_RESULT.DENIED,
          reason: "Reserva não confirmada ou já utilizada",
          timestamp: FieldValue.serverTimestamp(),
        });
        return { authorized: false, reason: "Reserva não confirmada" };
      }

      const arrival = reservation.arrival_expected.toDate();
      const earliestAllowed = new Date(arrival.getTime() - TOLERANCE_BEFORE_MS);
      const latestAllowed = new Date(arrival.getTime() + TOLERANCE_AFTER_MS);

      if (now < earliestAllowed || now > latestAllowed) {
        tx.set(eventRef, {
          event_id: eventId,
          reservation_id: reservationId,
          type,
          result: EVENT_RESULT.DENIED,
          reason: "Fora da janela de tolerância",
          timestamp: FieldValue.serverTimestamp(),
        });
        return { authorized: false, reason: "Fora do horário permitido" };
      }

      tx.update(resRef, { status: R_STATUS.CHECKED_IN });
    }

    if (type === EVENT_TYPE.EXIT) {
      if (reservation.status !== R_STATUS.CHECKED_IN) {
        tx.set(eventRef, {
          event_id: eventId,
          reservation_id: reservationId,
          type,
          result: EVENT_RESULT.DENIED,
          reason: "Veículo não está no estacionamento",
          timestamp: FieldValue.serverTimestamp(),
        });
        return { authorized: false, reason: "Veículo não registrou entrada" };
      }

      tx.update(resRef, {
        status: R_STATUS.COMPLETED,
        departure_real: FieldValue.serverTimestamp(),
      });
    }

    tx.set(eventRef, {
      event_id: eventId,
      reservation_id: reservationId,
      type,
      result: EVENT_RESULT.GRANTED,
      reason: null,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { authorized: true };
  });
}

export const iotService = {
  authorizeAccess,
};
