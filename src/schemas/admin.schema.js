import { z } from 'zod';

const createLotSchema = z
  .object({
    name: z.string().min(2).max(80),
    address: z.string().min(2).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    hourly_rate_cents: z.number().int().min(1).max(100000),
    opening_hours: z
      .object({
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .refine((hour) => hour.close > hour.open, { message: 'close must be after open' }),
    spaces_count: z.number().int().min(1).max(200),
    device_id: z.string().min(1).max(64).optional(),
  })
  .strict();

export const adminSchema = {
  createLotSchema,
};
