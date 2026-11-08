import { z } from "zod";

const isoDate = z.iso
  .datetime({
    offset: true,
    message: "use ISO 8601 (ex: 2026-11-10T10:00:00Z)",
  })
  .transform((s) => new Date(s));

const availabilityQuerySchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine((data) => data.from < data.to, {
    message: "`to` deve ser posterior a `from`",
    path: ["to"],
  });

export const parkingLotsSchema = {
  availabilityQuerySchema,
};
