import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@dsa/shared';
import { ApiError } from '../utils/ApiError.js';
import { ACCESS_COOKIE } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token || typeof token !== 'string') {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  },
);

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
      return;
    }
    next();
  };
}
