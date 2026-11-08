import { col } from "../db/index.js";
import { HttpError } from "../errors/http-error.js";

const PUBLIC_FIELDS = [
  "name",
  "address",
  "latitude",
  "longitude",
  "hourly_rate",
  "opening_hours",
];

function toPublic(doc) {
  const d = doc.data();
  const out = { id: doc.id };

  for (const f of PUBLIC_FIELDS) {
    out[f] = d[f];
  }

  return out;
}

async function getAllParkingLots() {
  const snap = await col.parkingLots.where("active", "==", true).get();

  return snap.docs.map(toPublic);
}

async function getAvailability({ lotId, from, to }) {
  const lotSnap = await col.parkingLots.doc(lotId).get();

  if (!lotSnap.exists || lotSnap.data().active !== true) {
    throw new HttpError(404, "Estacionamento não encontrado");
  }

  const spacesSnap = await col.spaces
    .where("parking_lot_id", "==", lotId)
    .where("active", "==", true)
    .get();
  const total = spacesSnap.size;
  const reservationsSnap = await col.reservations
    .where("parking_lot_id", "==", lotId)
    .get();
  const occupiedSpaceIds = new Set();

  for (const doc of reservationsSnap.docs) {
    const r = doc.data();

    if (r.status !== "CONFIRMED" && r.status !== "CHECKED_IN") {
      continue;
    }

    const arr = r.arrival_expected?.toDate?.() ?? new Date(r.arrival_expected);
    const dep =
      r.departure_expected?.toDate?.() ?? new Date(r.departure_expected);

    if (arr < to && dep > from) {
      occupiedSpaceIds.add(r.space_id);
    }
  }

  const occupied = occupiedSpaceIds.size;

  return {
    parking_lot_id: lotId,
    from: from.toISOString(),
    to: to.toISOString(),
    total_spaces: total,
    occupied,
    available: Math.max(0, total - occupied),
  };
}

export const parkingLotsService = {
  getAllParkingLots,
  getAvailability,
};
