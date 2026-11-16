import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_BASE_URL: z.url(),
    WEB_ORIGIN: z.url(),
    FIREBASE_PROJECT_ID: z.string().min(1),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
    MERCADOPAGO_ACCESS_TOKEN: z.string().default(''),
    MERCADOPAGO_WEBHOOK_SECRET: z.string().default(''),
    TELEGRAM_BOT_TOKEN: z.string().default(''),
    TELEGRAM_BOT_USERNAME: z.string().default(''),
    TELEGRAM_DEFAULT_CHAT_ID: z.string().default(''),
    DEVICE_SHARED_SECRET: z.string().min(16),
  })
  .check((ctx) => {
    if (ctx.value.NODE_ENV !== 'production') return;

    const required = [
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_WEBHOOK_SECRET',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_BOT_USERNAME',
      'TELEGRAM_DEFAULT_CHAT_ID',
    ];

    for (const key of required) {
      if (!ctx.value[key]) {
        ctx.issues.push({
          code: 'custom',
          path: [key],
          message: 'required in production',
          input: ctx.value[key],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');

  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = parsed.data;
