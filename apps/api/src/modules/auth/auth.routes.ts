import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authController from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));

authRouter.post('/refresh', asyncHandler(authController.refresh));

authRouter.post('/logout', asyncHandler(authController.logout));

authRouter.get('/me', requireAuth, asyncHandler(authController.me));
