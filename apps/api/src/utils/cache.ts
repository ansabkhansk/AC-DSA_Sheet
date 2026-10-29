import { createHash } from 'node:crypto';
import { getRedis, getRedisStatus } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const SHEET_CACHE_KEY = 'cache:sheet:tree:v1';

export type CachedSheetPayload = {
  body: string;
  etag: string;
};

export function computeEtag(body: string): string {
  const hash = createHash('sha1').update(body).digest('hex');
  return `"${hash}"`;
}

async function withRedis<T>(operation: (redis: NonNullable<ReturnType<typeof getRedis>>) => Promise<T>): Promise<T | null> {
  const redis = getRedis();
  if (!redis || getRedisStatus() !== 'up') {
    return null;
  }

  try {
    return await operation(redis);
  } catch (error) {
    logger.warn({ err: error }, 'Redis cache operation failed; continuing without cache');
    return null;
  }
}

export async function getCachedSheet(): Promise<CachedSheetPayload | null> {
  const raw = await withRedis((redis) => redis.get(SHEET_CACHE_KEY));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedSheetPayload;
    if (typeof parsed.body === 'string' && typeof parsed.etag === 'string') {
      return parsed;
    }
  } catch {
    // Corrupt entry — treat as miss.
  }
  return null;
}

export async function setCachedSheet(body: string, etag: string): Promise<boolean> {
  const payload = JSON.stringify({ body, etag } satisfies CachedSheetPayload);
  const result = await withRedis((redis) =>
    redis.set(SHEET_CACHE_KEY, payload, 'EX', env.SHEET_CACHE_TTL_SECONDS),
  );
  return result === 'OK';
}

export async function invalidateSheetCache(): Promise<void> {
  await withRedis((redis) => redis.del(SHEET_CACHE_KEY));
  logger.info({ key: SHEET_CACHE_KEY }, 'Sheet cache invalidated');
}
