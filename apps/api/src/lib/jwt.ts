import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../middleware/error.middleware.js';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId?: string;
}

export const jwtService = {
  signAccessToken(payload: AccessTokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  },

  signRefreshToken(payload: RefreshTokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (typeof decoded !== 'object' || !decoded || !('userId' in decoded) || !('role' in decoded)) {
        throw new UnauthorizedError('Invalid access token structure', 'INVALID_TOKEN');
      }
      return {
        userId: (decoded as any).userId,
        role: (decoded as any).role,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid access token', 'INVALID_TOKEN');
    }
  },

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      if (typeof decoded !== 'object' || !decoded || !('userId' in decoded)) {
        throw new UnauthorizedError('Invalid refresh token structure', 'INVALID_TOKEN');
      }
      return {
        userId: (decoded as any).userId,
        tokenId: (decoded as any).tokenId,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_TOKEN');
    }
  },
};
