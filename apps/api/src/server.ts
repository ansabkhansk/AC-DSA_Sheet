import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  await connectDb();
  await connectRedis();

  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API listening');
  });

  server.on('error', (error) => {
    logger.error({ err: error }, 'HTTP server failed');
    process.exit(1);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  } catch (error) {
    logger.warn({ err: error }, 'HTTP server close failed');
  }

  await disconnectDb();
  await disconnectRedis();
  clearTimeout(forceExit);
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start API');
  process.exit(1);
});
