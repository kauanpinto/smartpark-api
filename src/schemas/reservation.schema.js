import { z } from 'zod';

const createReservationSchema = z
  .object({
    parking_lot_id: z.string().min(1).max(64),
    arrival_expected: z.coerce.date(),
    departure_expected: z.coerce.date(),
  })
  .strict();

const listReservationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const reservationSchema = {
  createReservationSchema,
  listReservationsQuerySchema,
};
