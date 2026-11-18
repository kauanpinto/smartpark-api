import { z } from 'zod';

export const createReservationSchema = z
  .object({
    parking_lot_id: z.string().min(1).max(64),
    arrival_expected: z.coerce.date(),
    departure_expected: z.coerce.date(),
  })
  .strict();

export const reservationSchema = {
  createReservationSchema,
};
