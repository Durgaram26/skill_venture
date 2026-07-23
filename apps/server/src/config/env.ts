import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const nodeEnv = process.env.NODE_ENV ?? 'development';
if (nodeEnv === 'test') {
  dotenv.config({ path: path.join(root, '.env.test') });
} else {
  dotenv.config({ path: path.join(root, '.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
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
    throw new Error(`Invalid environment configuration: ${JSON.stringify(details)}`);
  }
  return parsed.data;
}

export const env = loadEnv();
