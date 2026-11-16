import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

export const db = getFirestore();
export const auth = getAuth();
