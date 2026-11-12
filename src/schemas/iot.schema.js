import { z } from "zod";

const accessBodySchema = z.object({
  eventId: z.string().min(1),
  reservationId: z.string().min(1),
  type: z.enum(["ENTRY", "EXIT"]),
});

export const iotSchema = {
  accessBodySchema,
};
