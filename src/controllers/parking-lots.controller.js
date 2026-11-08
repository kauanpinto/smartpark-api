import { parkingLotsSchema } from "../schemas/parking-lots.schema.js";
import { parkingLotsService } from "../services/parking-lots.service.js";

async function getAllParkingLots(_req, res, next) {
  try {
    const lots = await parkingLotsService.getAllParkingLots();

    res.json(lots);
  } catch (err) {
    next(err);
  }
}

async function getAvailability(req, res, next) {
  try {
    const { from, to } = parkingLotsSchema.availabilityQuerySchema.parse(req.query);
    const result = await parkingLotsService.getAvailability({
      lotId: req.params.id,
      from,
      to,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export const parkingLotsController = {
  getAllParkingLots,
  getAvailability,
};
