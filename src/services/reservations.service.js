import { randomUUID } from "crypto";
import { db, Timestamp, FieldValue } from "../config/firebase.js";
import { col } from "../db/index.js";
import { R_STATUS, PAYMENT_STATUS } from "../constants/index.js";
import { HttpError } from "../errors/http-error.js";
import { estimatePrice } from "./pricing.service.js";
import { paymentsService } from "./payments.service.js";
import { env } from "../config/env.js";

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

async function createCheckout({ reservationId, userId, userEmail }) {
  const resRef = col.reservations.doc(reservationId);
  const resSnap = await resRef.get();

  if (!resSnap.exists) {
    throw new HttpError(404, "Reserva não encontrada");
  }

  const reservation = resSnap.data();

  if (reservation.user_id !== userId) {
    throw new HttpError(403, "Acesso negado a esta reserva");
  }

  if (reservation.status !== R_STATUS.PENDING_PAYMENT) {
    throw new HttpError(400, "Reserva não está pendente de pagamento");
  }

  if (reservation.expires_at.toDate() < new Date()) {
    await resRef.update({ status: R_STATUS.EXPIRED });
    throw new HttpError(400, "Reserva expirada");
  }

  const existingPayment = await col.payments
    .where("reservation_id", "==", reservationId)
    .where("status", "==", PAYMENT_STATUS.PENDING)
    .get();

  if (!existingPayment.empty) {
    throw new HttpError(
      409,
      "Já existe um pagamento pendente para esta reserva",
    );
  }

  const lotSnap = await col.parkingLots.doc(reservation.parking_lot_id).get();
  const lot = lotSnap.data();

  const orderResponse = await paymentsService.createCheckoutOrder({
    reservationId,
    title: `Estacionamento - ${lot.name}`,
    amount: reservation.price_estimate,
    payerEmail: userEmail || "teste@teste.com",
    baseUrl: env.APP_BASE_URL,
    idempotencyKey: randomUUID(),
  });

  await col.payments.add({
    reservation_id: reservationId,
    provider: "mercadopago",
    preference_id: orderResponse.id,
    status: PAYMENT_STATUS.PENDING,
    amount: reservation.price_estimate,
    currency: "BRL",
    created_at: FieldValue.serverTimestamp(),
  });

  return { checkoutUrl: orderResponse.checkout_url };
}

async function confirmPayment({ reservationId, paymentId }) {
  const resRef = col.reservations.doc(reservationId);
  return db.runTransaction(async (tx) => {
    const resSnap = await tx.get(resRef);

    if (!resSnap.exists) {
      return null;
    }

    const reservation = resSnap.data();

    if (reservation.status === R_STATUS.CONFIRMED) {
      return reservation;
    }

    if (reservation.status !== R_STATUS.PENDING_PAYMENT) {
      return null;
    }

    tx.update(resRef, {
      status: R_STATUS.CONFIRMED,
      updated_at: FieldValue.serverTimestamp(),
    });

    const paymentRef = col.payments.doc(paymentId);

    tx.set(
      paymentRef,
      {
        reservation_id: reservationId,
        provider: "mercadopago",
        payment_id: paymentId,
        status: PAYMENT_STATUS.APPROVED,
        verified_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { ...reservation, status: R_STATUS.CONFIRMED };
  });
}

async function getUserReservations(userId) {
  const snap = await col.reservations.where("user_id", "==", userId).get();
  const reservations = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    reservations.push({
      id: doc.id,
      ...data,
      arrival_expected: data.arrival_expected?.toDate().toISOString(),
      departure_expected: data.departure_expected?.toDate().toISOString(),
      created_at: data.created_at?.toDate().toISOString(),
    });
  }

  return reservations;
}

export const reservationsService = {
  createReservation,
  createCheckout,
  confirmPayment,
  getUserReservations,
};
