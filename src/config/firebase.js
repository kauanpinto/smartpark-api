import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { env } from "./env.js";

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

export const db = getFirestore();

db.settings({ ignoreUndefinedProperties: true });

export { FieldValue, Timestamp };
