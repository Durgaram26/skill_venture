import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
      code: 'INTERNAL_ERROR',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
}
