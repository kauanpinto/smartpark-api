import { HttpError } from "../errors/http-error.js";

export function estimatePrice({ hourlyRate, arrival, departure }) {
  if (!(arrival instanceof Date) || !(departure instanceof Date)) {
    throw new HttpError(400, "Datas inválidas para cálculo");
  }
  
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    throw new HttpError(500, "Tarifa do estacionamento inválida");
  }

  const ms = departure.getTime() - arrival.getTime();
  
  if (ms <= 0) {
    throw new HttpError(400, "Período inválido para cálculo");
  }

  const hours = Math.ceil(ms / (1000 * 60 * 60));
  const amount = Number((hours * hourlyRate).toFixed(2));

  return { hours, hourlyRate, amount };
}
