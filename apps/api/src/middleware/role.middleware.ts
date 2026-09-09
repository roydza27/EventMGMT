import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from './error.middleware.js';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required before role check', 'UNAUTHENTICATED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource', 'FORBIDDEN'));
      return;
    }

    next();
  };
}
