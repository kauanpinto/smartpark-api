import { db } from '../src/config/firebase.js';
import { COLLECTIONS } from '../src/constants/index.js';
import { Timestamp } from 'firebase-admin/firestore';

const lots = [
  {
    id: 'lot-centro',
    name: 'Unidade Centro',
    latitude: -12.26,
    longitude: -38.97,
    hourly_rate_cents: 500,
    opening_hours: { open: '06:00', close: '22:00' },
    address: 'Centro, Feira de Santana - BA',
  },
  {
    id: 'lot-shopping',
    name: 'Unidade Shopping',
    latitude: -12.24,
    longitude: -38.95,
    hourly_rate_cents: 800,
    opening_hours: { open: '06:00', close: '22:30' },
    address: 'Shopping, Feira de Santana - BA',
  },
];

async function main() {
  try {
    for (const lot of lots) {
      const lotRef = db.collection(COLLECTIONS.PARKING_LOTS).doc(lot.id);
      const lotSnap = await lotRef.get();

      if (!lotSnap.exists) {
        const { id, ...lotData } = lot;
        await lotRef.set({ ...lotData, active: true, created_at: Timestamp.now() });
      }

      for (let i = 1; i < 11; i++) {
        const spaceId = `A-${String(i).padStart(2, '0')}`;
        const spaceRef = db.collection(COLLECTIONS.SPACES).doc(`${lot.id}-${spaceId}`);
        const spaceSnap = await spaceRef.get();

        if (!spaceSnap.exists) {
          await spaceRef.set({
            parking_lot_id: lot.id,
            label: spaceId,
            active: true,
            occupancy_state: 'FREE',
          });
        }
      }

      const deviceId = `dev-${lot.id.split('-').slice(1).join('-')}-01`;
      const deviceRef = db.collection(COLLECTIONS.DEVICES).doc(deviceId);
      const deviceSnap = await deviceRef.get();

      if (!deviceSnap.exists) {
        await deviceRef.set({
          parking_lot_id: lot.id,
          last_seen: null,
          status: 'OFFLINE',
          firmware_version: '1.0.0',
          offline_alerted: false,
        });
      }
    }

    console.log('Seed concluído');
  } catch (error) {
    console.error('Seed não concluída, error: ', error);
    process.exit(1);
  }
}

await main();
