import { col } from "../db/index.js";

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

export const parkingLotsService = {
  getAllParkingLots,
};
