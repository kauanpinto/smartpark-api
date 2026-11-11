import { db, Timestamp, FieldValue } from "../config/firebase.js";
import { col } from "../db/index.js";
import { R_STATUS } from "../constants/index.js";
import { HttpError } from "../errors/http-error.js";
import { estimatePrice } from "./pricing.service.js";

const RESERVATION_TTL_MINUTES = 15;

async function createReservation({
  userId,
  parkingLotId,
  spaceId,
  arrivalExpected,
  departureExpected,
}) {
  return db.runTransaction(async (tx) => {
    const lotRef = col.parkingLots.doc(parkingLotId);
    const lotSnap = await tx.get(lotRef);

    if (!lotSnap.exists || lotSnap.data().active !== true) {
      throw new HttpError(404, "Estacionamento não encontrado");
    }

    const lot = lotSnap.data();
    const spaceRef = col.spaces.doc(spaceId);
    const spaceSnap = await tx.get(spaceRef);

    if (!spaceSnap.exists || spaceSnap.data().active !== true) {
      throw new HttpError(404, "Vaga não encontrada");
    }

    if (spaceSnap.data().parking_lot_id !== parkingLotId) {
      throw new HttpError(400, "Vaga não pertence a este estacionamento");
    }

    const conflictSnap = await tx.get(
      col.reservations.where("space_id", "==", spaceId),
    );

    for (const doc of conflictSnap.docs) {
      const r = doc.data();

      if (r.status !== R_STATUS.CONFIRMED && r.status !== R_STATUS.CHECKED_IN) {
        continue;
      }

      const arr = r.arrival_expected.toDate();
      const dep = r.departure_expected.toDate();

      if (arr < departureExpected && dep > arrivalExpected) {
        throw new HttpError(409, "Vaga já reservada neste período");
      }
    }

    const pricing = estimatePrice({
      hourlyRate: lot.hourly_rate,
      arrival: arrivalExpected,
      departure: departureExpected,
    });
    const reservationRef = col.reservations.doc();
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + RESERVATION_TTL_MINUTES * 60 * 1000,
    );

    tx.set(reservationRef, {
      user_id: userId,
      parking_lot_id: parkingLotId,
      space_id: spaceId,
      arrival_expected: Timestamp.fromDate(arrivalExpected),
      departure_expected: Timestamp.fromDate(departureExpected),
      status: R_STATUS.PENDING_PAYMENT,
      price_estimate: pricing.amount,
      expires_at: expiresAt,
      created_at: FieldValue.serverTimestamp(),
    });

    return {
      id: reservationRef.id,
      user_id: userId,
      parking_lot_id: parkingLotId,
      space_id: spaceId,
      arrival_expected: arrivalExpected.toISOString(),
      departure_expected: departureExpected.toISOString(),
      status: R_STATUS.PENDING_PAYMENT,
      price_estimate: pricing.amount,
      expires_at: expiresAt.toDate().toISOString(),
    };
  });
}

export const reservationsService = {
  createReservation,
};
