import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 400,
    code = 'BAD_REQUEST',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown, code = 'VALIDATION_ERROR') {
    super(message, 400, code, details);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    // Operational/handled domain error
    if (err.statusCode >= 500) {
      logger.error(`Server error: ${err.message}`, err, { path: req.path, method: req.method });
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unexpected / unhandled error
  logger.error(`Unhandled exception: ${err.message}`, err, {
    path: req.path,
    method: req.method,
  });

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  });
}
