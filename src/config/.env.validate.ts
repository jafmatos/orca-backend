import { z } from 'zod';

export const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'testing'])
    .default('development'),
  LOG_LEVEL: z.string().default('info'),
  APP_PORT: z.coerce.number().default(3333),
  APP_HOST: z.string().default('127.0.0.1'),
  APP_DIR: z.string().optional(),
  APP_URL: z.string().optional(),
  APP_SUPER_USER_NAME: z.string(),
  APP_SUPER_USER_EMAIL: z.string().email(),
  APP_SUPER_USER_PASSWORD: z.string(),

  // Frontend
  FRONTEND_POLICY_URL: z.url(),
  FRONTEND_TERMS_URL: z.url(),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASS: z.string(),
  DB_NAME: z.string(),
  DB_TIMEZONE: z.string().default('UTC'),
  DB_LOGGING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  DB_SYNCHRONIZE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),

  // SMTP (Email)
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_ORIGIN: z.string(),

  // Stripe
  STRIPE_KEY: z.string(),
  STRIPE_ENDPOINT_SECRET: z.string().optional(),

  // Security & Auth
  JWT_TOKEN_SECRET: z.string(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // Push Notifications (VAPID)
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // BullMQ / Bull Board
  BULLBOARD_USER_LOGIN: z.string(),
  BULLBOARD_USER_PASSWORD: z.string(),

  // OpenAI
  OPENAI_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),

  // Testing
  TESTING_DEFAULT_USER_PASSWORD: z.string(),
  TESTING_DEFAULT_OTP_CODE: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error('Erros de validação nas variáveis de ambiente:');

    parsed.error.issues.forEach((issue) => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });

    throw new Error('Configuração de ambiente inválida');
  }

  return parsed.data;
}
