import { z } from 'zod';

const accessRequestSchema = z
  .object({
    event_id: z.string().min(8).max(64),
    type: z.enum(['ENTRY', 'EXIT']),
    reservation_code: z.string().min(6).max(20),
  })
  .strict();

export const iotSchema = {
  accessRequestSchema,
};
