import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_BASE_URL: z.url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:\n");
  console.error(z.treeifyError(parsed.error));
}

export const env = parsed.data;
