import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRateLimiter, resetMemoryRateLimits } from '../src/middlewares/rateLimit.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

function buildApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    '/limited',
    createRateLimiter({ windowMs: 60_000, max: 2, prefix: 'test' }),
    (_req, res) => {
      res.status(200).json({ success: true, data: { ok: true } });
    },
  );
  app.use(errorHandler);
  return app;
}

describe('rateLimit middleware', () => {
  beforeEach(() => {
    resetMemoryRateLimits();
  });

  it('allows requests under the max and returns 429 with Retry-After after', async () => {
    const app = buildApp();

    const first = await request(app).get('/limited');
    expect(first.status).toBe(200);
    expect(first.headers['x-ratelimit-limit']).toBe('2');

    const second = await request(app).get('/limited');
    expect(second.status).toBe(200);

    const third = await request(app).get('/limited');
    expect(third.status).toBe(429);
    expect(third.headers['retry-after']).toBeTruthy();
    expect(third.body).toMatchObject({
      success: false,
      error: { code: 'RATE_LIMITED' },
    });
  });

  it('uses X-Forwarded-For when trust proxy is enabled', async () => {
    const app = buildApp();

    await request(app).get('/limited').set('X-Forwarded-For', '203.0.113.10');
    await request(app).get('/limited').set('X-Forwarded-For', '203.0.113.10');
    const blocked = await request(app).get('/limited').set('X-Forwarded-For', '203.0.113.10');
    expect(blocked.status).toBe(429);

    // A different client IP still has budget.
    const other = await request(app).get('/limited').set('X-Forwarded-For', '203.0.113.20');
    expect(other.status).toBe(200);
  });
});
