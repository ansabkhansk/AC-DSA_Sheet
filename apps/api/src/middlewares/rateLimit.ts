import type { NextFunction, Request, Response } from 'express';
import { getRedis, getRedisStatus } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  /** Key prefix so auth and general API counters stay separate. */
  prefix: string;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

function clientIp(req: Request): string {
  // With `trust proxy`, Express sets `req.ip` from X-Forwarded-For.
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function memoryConsume(key: string, windowMs: number, max: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > max) {
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  return { allowed: true, remaining: Math.max(0, max - existing.count), retryAfterSec };
}

async function redisConsume(
  key: string,
  windowMs: number,
  max: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSec: number } | null> {
  const redis = getRedis();
  if (!redis || getRedisStatus() !== 'up') {
    return null;
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }
    let ttl = await redis.pttl(key);
    if (ttl < 0) {
      await redis.pexpire(key, windowMs);
      ttl = windowMs;
    }
    const retryAfterSec = Math.max(1, Math.ceil(ttl / 1000));
    if (count > max) {
      return { allowed: false, remaining: 0, retryAfterSec };
    }
    return { allowed: true, remaining: Math.max(0, max - count), retryAfterSec };
  } catch (error) {
    logger.warn({ err: error }, 'Redis rate limit failed; falling back to memory');
    return null;
  }
}

/**
 * Fixed-window rate limiter. Prefers Redis (shared across instances); falls back
 * to an in-process Map when Redis is disabled or unreachable (C3).
 */
export function createRateLimiter(options: RateLimitOptions) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const ip = clientIp(req);
    const key = `rl:${options.prefix}:${ip}`;

    let result = await redisConsume(key, options.windowMs, options.max);
    if (!result) {
      result = memoryConsume(key, options.windowMs, options.max);
    }

    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSec));
      throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
    }

    next();
  });
}

/** Test helper — clears the in-memory buckets between rate-limit tests. */
export function resetMemoryRateLimits(): void {
  memoryBuckets.clear();
}
