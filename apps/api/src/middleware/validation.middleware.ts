import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware.js';

interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: RequestValidationSchema | ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schemas && typeof schemas.parseAsync === 'function') {
        // Direct body validation shorthand
        req.body = (await schemas.parseAsync(req.body)) as any;
      } else {
        const complexSchema = schemas as RequestValidationSchema;
        if (complexSchema.body) {
          req.body = (await complexSchema.body.parseAsync(req.body)) as any;
        }
        if (complexSchema.query) {
          req.query = (await complexSchema.query.parseAsync(req.query)) as any;
        }
        if (complexSchema.params) {
          req.params = (await complexSchema.params.parseAsync(req.params)) as any;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        next(new ValidationError('Invalid request data', issues));
        return;
      }
      next(error);
    }
  };
}
