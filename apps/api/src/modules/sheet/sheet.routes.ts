import { Router } from 'express';
import { problemsQuerySchema } from '@dsa/shared';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as sheetController from './sheet.controller.js';

export const sheetRouter = Router();

sheetRouter.get('/', asyncHandler(sheetController.getSheet));

sheetRouter.get('/chapters/:slug', asyncHandler(sheetController.getChapter));

export const problemsRouter = Router();

problemsRouter.get(
  '/',
  validate({ query: problemsQuerySchema }),
  asyncHandler(sheetController.getProblems),
);
