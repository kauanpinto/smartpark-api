import { z } from "zod";

export const parkingLotSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto"),
  address: z.string().trim().min(1, "Endereço é obrigatório"),
  latitude: z.number().min(-90, "Abaixo do limite").max(90, "Acima do limite"),
  longitude: z
    .number()
    .min(-180, "Abaixo do limite")
    .max(180, "Acima do limite"),
  hourlyRate: z
    .number({ error: "Informe o valor por hora" })
    .positive("O valor por hora deve ser positivo"),
  openingHours: z.string(),
  active: z.boolean().default(true),
});
