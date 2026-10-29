import { Router } from 'express';
import {
  createPlanBodySchema,
  generatePlansBodySchema,
  listPlansQuerySchema,
  planIdParamsSchema,
  updatePlanBodySchema,
} from '@dsa/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as calendarController from './calendar.controller.js';

export const plansRouter = Router();

plansRouter.use(requireAuth);

plansRouter.get(
  '/',
  validate({ query: listPlansQuerySchema }),
  asyncHandler(calendarController.list),
);

plansRouter.post(
  '/generate',
  validate({ body: generatePlansBodySchema }),
  asyncHandler(calendarController.generate),
);

plansRouter.post(
  '/',
  validate({ body: createPlanBodySchema }),
  asyncHandler(calendarController.create),
);

plansRouter.patch(
  '/:id',
  validate({ params: planIdParamsSchema, body: updatePlanBodySchema }),
  asyncHandler(calendarController.update),
);

plansRouter.delete(
  '/:id',
  validate({ params: planIdParamsSchema }),
  asyncHandler(calendarController.remove),
);
