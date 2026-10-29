import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export type RedisStatus = 'up' | 'down' | 'disabled';

let client: Redis | null = null;
let status: RedisStatus = 'disabled';

export function getRedis(): Redis | null {
  return client;
}

export function getRedisStatus(): RedisStatus {
  return status;
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) {
    status = 'disabled';
    client = null;
    logger.info('Redis disabled');
    return;
  }

  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
  });

  redis.on('error', (error) => {
    status = 'down';
    logger.warn({ err: error }, 'Redis error');
  });

  try {
    await redis.connect();
    await redis.ping();
    client = redis;
    status = 'up';
    logger.info('Redis connected');
  } catch (error) {
    status = 'down';
    client = null;
    redis.disconnect();
    logger.warn({ err: error }, 'Redis unavailable; continuing in degraded mode');
  }
}

export async function getLiveRedisStatus(): Promise<RedisStatus> {
  if (!env.REDIS_ENABLED) {
    return 'disabled';
  }

  if (!client) {
    return 'down';
  }

  try {
    const reply = await client.ping();
    status = reply === 'PONG' ? 'up' : 'down';
  } catch {
    status = 'down';
  }

  return status;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) {
    return;
  }

  try {
    await client.quit();
  } catch {
    client.disconnect();
  } finally {
    client = null;
    if (env.REDIS_ENABLED) {
      status = 'down';
    }
    logger.info('Redis disconnected');
  }
}
