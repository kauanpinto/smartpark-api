import { parkingLotsService } from "../services/parking-lots.service.js";

async function getAllParkingLots(req, res, next) {
  try {
    const lots = await parkingLotsService.getAllParkingLots();
    res.json(lots);
  } catch (error) {
    next(error);
  }
}

export const parkingLotsController = {
  getAllParkingLots,
};
