import { db } from "../config/firebase.js";
import { COL } from "../constants/collections.js";

export const col = {
  parkingLots: db.collection(COL.PARKING_LOTS),
  spaces: db.collection(COL.SPACES),
  reservations: db.collection(COL.RESERVATIONS),
  payments: db.collection(COL.PAYMENTS),
  accessEvents: db.collection(COL.ACCESS_EVENTS),
  tickets: db.collection(COL.TICKETS),
  devices: db.collection(COL.DEVICES),
  notifications: db.collection(COL.NOTIFICATIONS),
};
