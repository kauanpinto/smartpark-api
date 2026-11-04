import "dotenv/config";
import { db } from "../src/config/firebase.js";

async function inspectFirestore() {
  console.log("Conectando ao Firestore...\n");

  let collections;
  
  try {
    collections = await db.listCollections();
  } catch (error) {
    console.error("Falha ao conectar ao Firestore");
    console.error(`Código: ${error.code ?? "desconhecido"}`);
    console.error(`Mensagem: ${error.message}`);
    process.exit(1);
  }

  if (collections.length === 0) {
    console.log("Conexão: OK — nenhuma coleção encontrada");
    process.exit(0);
  }

  console.log(`Conexão: OK — ${collections.length} coleção(ões)\n`);

  for (const collection of collections) {
    const [sample, countSnap] = await Promise.all([
      collection.limit(1).get(),
      collection.count().get(),
    ]);

    if (sample.empty) {
      console.log(`${collection.id} — vazia`);
      continue;
    }

    const fields = Object.keys(sample.docs[0].data());
    
    console.log(`${collection.id} — ${countSnap.data().count} documento(s)`);
    console.log(`Campos (amostra): ${fields.join(", ")}`);
  }

  process.exit(0);
}

inspectFirestore();
