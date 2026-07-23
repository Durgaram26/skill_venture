import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.flatten()));
      return;
    }
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.flatten()));
      return;
    }
    req.params = result.data as Request['params'];
    next();
  };
}
