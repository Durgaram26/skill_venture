import { z } from 'zod';
import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// In production (Netlify Functions / Railway), env vars are injected by the platform.
// Only load .env files for local development and tests.
if (nodeEnv === 'test') {
  dotenv.config({ path: '.env.test' });
} else if (nodeEnv !== 'production') {
  dotenv.config({ path: '.env' });
}

const envSchema = z.object({
  // Trim and take first word only — guards against accidental values like "development npm ci"
  NODE_ENV: z
    .string()
    .default('development')
    .transform((v) => v.trim().split(/\s+/)[0] ?? 'development')
    .pipe(z.enum(['development', 'test', 'production', 'staging'])),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().min(12).default(12),
  CLIENT_URL: z.string().url(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? nodeEnv,
  });
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    // Log clearly so the reason appears in Netlify function logs
    console.error('[env] ❌ Missing/invalid environment variables:', JSON.stringify(details, null, 2));
    throw new Error(`Invalid environment configuration: ${JSON.stringify(details)}`);
  }
  console.log('[env] ✅ Environment validated (NODE_ENV=%s)', parsed.data.NODE_ENV);
  return parsed.data;
}

export const env = loadEnv();
