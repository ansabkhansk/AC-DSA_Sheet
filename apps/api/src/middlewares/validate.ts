import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

function formatZodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request['query'];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', formatZodDetails(error)));
        return;
      }
      next(error);
    }
  };
}
