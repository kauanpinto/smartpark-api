import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { env } from "./env.js";

if (!getApps().length) {
  let credential;

  if (process.env.FIREBASE_CREDENTIALS_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
    credential = cert(serviceAccount);
  } else {
    credential = applicationDefault();
  }

  initializeApp({
    credential: credential,
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

export const db = getFirestore();

db.settings({ ignoreUndefinedProperties: true });

export { FieldValue, Timestamp };
