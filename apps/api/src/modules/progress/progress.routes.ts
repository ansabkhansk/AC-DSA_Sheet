import { Router } from 'express';
import { progressParamsSchema, upsertProgressBodySchema } from '@dsa/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as progressController from './progress.controller.js';

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.get('/me', asyncHandler(progressController.getMe));

progressRouter.get('/stats', asyncHandler(progressController.getStats));

progressRouter.put(
  '/:problemId',
  validate({ params: progressParamsSchema, body: upsertProgressBodySchema }),
  asyncHandler(progressController.upsert),
);

progressRouter.delete(
  '/:problemId',
  validate({ params: progressParamsSchema }),
  asyncHandler(progressController.remove),
);
