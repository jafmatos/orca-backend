import { z } from 'zod';

const assertIsTruthyInTestingEnv = (value: unknown) => {
  if (process.env.NODE_ENV !== 'testing') return true;

  return !!value;
};

export const envSchema = z.object({
  // App
  SILENT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
  NODE_ENV: z
    .enum(['development', 'production', 'testing', 'test'])
    .default('development'),
  LOG_LEVEL: z.string().default('info'),
  SEED_ON_BOOTSTRAP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  APP_PORT: z.coerce.number().default(3333),
  APP_HOST: z.string().default('127.0.0.1'),
  APP_DIR: z.string().optional(),
  APP_URL: z.string().optional(),

  // Frontend
  FRONTEND_BASE_URL: z.string().optional(),
  FRONTEND_POLICY_URL: z.string().optional(),
  FRONTEND_TERMS_URL: z.string().optional(),

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
  TESTING_USER_DEFAULT_PASSWORD: z.string().optional().refine(assertIsTruthyInTestingEnv),
  TESTING_DEFAULT_OTP_CODE: z.string().optional().refine(assertIsTruthyInTestingEnv),
  TESTING_SUPER_USER_NAME: z.string().optional().refine(assertIsTruthyInTestingEnv),
  TESTING_SUPER_USER_EMAIL: z.email().optional().refine(assertIsTruthyInTestingEnv),
  TESTING_SUPER_USER_PASSWORD: z.string().optional().refine(assertIsTruthyInTestingEnv),
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
