import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
dotenv.config({ path: path.join(monorepoRoot, '.env'), quiet: true });

function envBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === '') {
      return defaultValue;
    }
    if (value === true || value === 'true' || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === '0') {
      return false;
    }
    return value;
  }, z.boolean());
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_POOL_SIZE: z.coerce.number().int().positive().default(50),
  REDIS_ENABLED: envBoolean(false),
  REDIS_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters'),
  COOKIE_SECURE: envBoolean(false),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Sliding window length for rate limits (ms). Default 60s. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  /** Max requests per window for general `/api/v1/*` routes. Auth is stricter. */
  RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(300),
  /** Max requests per window for `/api/v1/auth/*` (stricter than API). */
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(30),
  /** Redis TTL for the sheet tree cache (seconds). Default 1 hour. */
  SHEET_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = [
    ...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? 'unknown'))),
  ];
  console.error(`Invalid environment: ${fields.join(', ')}`);
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  process.exit(1);
}

if (parsed.data.REDIS_ENABLED && !parsed.data.REDIS_URL) {
  console.error('Invalid environment: REDIS_URL');
  console.error('  - REDIS_URL: required when REDIS_ENABLED=true');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  REDIS_URL: parsed.data.REDIS_URL ?? '',
};

export type Env = typeof env;
