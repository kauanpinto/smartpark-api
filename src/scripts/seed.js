import { db, FieldValue } from "../config/firebase.js";
import { col } from "../db/index.js";

const LOTS = [
  {
    id: "lot_centro",
    name: "Unidade Centro",
    address: "R. das Flores, 123 — Centro",
    latitude: -23.5505,
    longitude: -46.6333,
    hourly_rate: 12.0,
    opening_hours: "06:00-23:00",
    active: true,
    spaceCount: 10,
    prefix: "A",
  },
  {
    id: "lot_shopping",
    name: "Unidade Shopping",
    address: "Av. do Comércio, 456 — Shopping",
    latitude: -23.5629,
    longitude: -46.6544,
    hourly_rate: 15.0,
    opening_hours: "10:00-22:00",
    active: true,
    spaceCount: 8,
    prefix: "B",
  },
];

async function wipeCollections() {
  for (const ref of Object.values(col)) {
    const snap = await ref.get();
    
    if (snap.empty) {
      continue;
    }

    const batch = db.batch();
    
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    console.log(`Limpo: ${ref.path} (${snap.size} docs)`);
  }
}

async function seed() {
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const lot of LOTS) {
    const { spaceCount, prefix, id, ...data } = lot;

    batch.set(col.parkingLots.doc(id), { ...data, created_at: now });

    for (let i = 1; i <= spaceCount; i++) {
      const label = `${prefix}-${String(i).padStart(2, "0")}`;
      batch.set(col.spaces.doc(`${id}_${label}`), {
        parking_lot_id: id,
        label,
        active: true,
        occupancy_state: "FREE",
        created_at: now,
      });
    }
  }

  await batch.commit();

  const totalSpaces = LOTS.reduce((s, l) => s + l.spaceCount, 0);
  console.log(`${LOTS.length} lots criados:`);
  
  for (const lot of LOTS) {
    console.log(`• ${lot.name} (${lot.id}) — ${lot.spaceCount} vagas`);
  }
  console.log(`\n${totalSpaces} vagas no total.`);
}

const reset = process.argv.includes("--reset");

(async () => {
  try {
    if (reset) {
      console.log("--reset detectado. Apagando coleções...\n");
      await wipeCollections();
      console.log("");
    }
    await seed();
    process.exit(0);
  } catch (error) {
    console.error("Erro no seed:", error);
    process.exit(1);
  }
})();
