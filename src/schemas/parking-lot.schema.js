import { z } from 'zod';

const availabilityQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.to > data.from, {
    message: 'to must after from',
    path: ['to'],
  });

export const parkingLotSchema = {
  availabilityQuerySchema,
};
