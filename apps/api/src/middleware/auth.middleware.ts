import { Request, Response, NextFunction } from 'express';
import { jwtService, AccessTokenPayload } from '../lib/jwt.js';
import { UnauthorizedError } from './error.middleware.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new UnauthorizedError('Authorization header required', 'NO_TOKEN_PROVIDED'));
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next(new UnauthorizedError('Authorization header must be Bearer token', 'INVALID_AUTH_HEADER'));
    return;
  }

  const token = parts[1];
  try {
    const payload = jwtService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}
