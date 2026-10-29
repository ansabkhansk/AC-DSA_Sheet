import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
}
