import { db } from "../config//firebase.js";

export async function getAllParkingLots(_req, res) {
  try {
    const snapshot = await db.collection("parkingLots").get();

    const lots = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(lots);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
}
