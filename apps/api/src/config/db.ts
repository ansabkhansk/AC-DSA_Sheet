import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: env.MONGO_POOL_SIZE,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.warn({ err: error }, 'MongoDB disconnect failed');
  }
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}
