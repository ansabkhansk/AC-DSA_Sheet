import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import { difficultySchema } from '@dsa/shared';
import { env } from './config/env.js';
import { isMongoReady } from './config/db.js';
import { logger } from './config/logger.js';
import { getLiveRedisStatus } from './config/redis.js';
import { requireAuth, requireRole } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { validate } from './middlewares/validate.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { progressRouter } from './modules/progress/progress.routes.js';
import { problemsRouter, sheetRouter } from './modules/sheet/sheet.routes.js';
import { asyncHandler } from './utils/asyncHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    pinoHttp({
      logger,
      genReqId(req, res) {
        const existing = req.headers['x-request-id'];
        const requestId =
          typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
        res.setHeader('x-request-id', requestId);
        return requestId;
      },
      customProps(req) {
        return { requestId: req.id };
      },
      serializers: {
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
          };
        },
      },
    }),
  );

  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const mongo = isMongoReady() ? 'up' : 'down';
      const redis = await getLiveRedisStatus();
      const ok = mongo === 'up';

      res.status(ok ? 200 : 503).json({
        success: ok,
        data: {
          status: ok ? 'ok' : 'degraded',
          mongo,
          redis,
        },
      });
    }),
  );

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/sheet', sheetRouter);
  app.use('/api/v1/problems', problemsRouter);
  app.use('/api/v1/progress', progressRouter);

  // Temporary routes used to verify P2/P3 acceptance criteria.
  if (env.NODE_ENV !== 'production') {
    app.post(
      '/api/v1/_test/validate',
      validate({
        body: z.object({
          difficulty: difficultySchema,
        }),
      }),
      (_req, res) => {
        res.status(200).json({ success: true, data: { ok: true } });
      },
    );

    app.get('/api/v1/_test/error', () => {
      throw new Error('Intentional test error');
    });

    app.post('/api/v1/_test/shutdown', (_req, res) => {
      res.status(200).json({ success: true, data: { shuttingDown: true } });
      setImmediate(() => {
        process.emit('SIGTERM');
      });
    });

    app.get('/api/v1/_test/protected', requireAuth, (_req, res) => {
      res.status(200).json({ success: true, data: { ok: true } });
    });

    app.get('/api/v1/_test/admin', requireAuth, requireRole('admin'), (_req, res) => {
      res.status(200).json({ success: true, data: { ok: true } });
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
