import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom operational errors
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // PostgreSQL errors
  if ('code' in err) {
    const pgError = err as { code: string; detail?: string; constraint?: string };

    switch (pgError.code) {
      case '23505': // Unique violation
        res.status(409).json({
          success: false,
          error: 'Resource already exists',
          detail: pgError.detail,
        });
        return;
      case '23503': // Foreign key violation
        res.status(400).json({
          success: false,
          error: 'Referenced resource not found',
          detail: pgError.detail,
        });
        return;
      case '23502': // Not null violation
        res.status(400).json({
          success: false,
          error: 'Required field missing',
          detail: pgError.detail,
        });
        return;
    }
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

// Custom error class for operational errors
export class OperationalError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators
export const NotFoundError = (resource: string) =>
  new OperationalError(`${resource} not found`, 404);

export const BadRequestError = (message: string) =>
  new OperationalError(message, 400);

export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new OperationalError(message, 401);

export const ForbiddenError = (message: string = 'Forbidden') =>
  new OperationalError(message, 403);

export const ConflictError = (message: string) =>
  new OperationalError(message, 409);

export default errorMiddleware;
