import { z } from "zod";

const isoDate = z.iso
  .datetime({
    offset: true,
    message: "use ISO 8601 (ex: 2026-11-10T10:00:00Z)",
  })
  .transform((s) => new Date(s));

const createReservationSchema = z
  .object({
    parkingLotId: z.string().min(1),
    spaceId: z.string().min(1),
    arrivalExpected: isoDate,
    departureExpected: isoDate,
  })
  .refine((data) => data.arrivalExpected < data.departureExpected, {
    message: "`departureExpected` deve ser posterior a `arrivalExpected`",
    path: ["departureExpected"],
  })
  .refine((data) => data.arrivalExpected.getTime() > Date.now(), {
    message: "`arrivalExpected` deve estar no futuro",
    path: ["arrivalExpected"],
  });

export const reservationsSchema = {
  createReservationSchema,
};
