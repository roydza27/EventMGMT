import crypto from 'node:crypto';
import { UserRole } from '@eventmgmt/shared';
import prisma from '../../config/database.js';
import { env } from '../../config/env.js';
import { passwordService } from '../../lib/password.js';
import { jwtService } from '../../lib/jwt.js';
import { logger } from '../../lib/logger.js';
import { UnauthorizedError, NotFoundError } from '../../middleware/error.middleware.js';
import { LoginInput, RefreshInput } from './auth.schema.js';
import { AuthUser, LoginResult, RefreshResult } from './auth.types.js';

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return val * 1000;
    case 'm':
      return val * 60 * 1000;
    case 'h':
      return val * 60 * 60 * 1000;
    case 'd':
      return val * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  college: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authService = {
  /**
   * Authenticate user with email and password.
   * Emits access and refresh tokens.
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await passwordService.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 1. Generate access token
    const accessToken = jwtService.signAccessToken({
      userId: user.id,
      role: user.role,
    });

    // 2. Generate and persist refresh token
    const tokenId = crypto.randomUUID();
    const refreshToken = jwtService.signRefreshToken({
      userId: user.id,
      tokenId,
    });

    const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  },

  /**
   * Rotate a refresh token and issue a new access token.
   * Enforces replay detection: if a revoked/previously rotated token is presented,
   * all active tokens for that user are revoked.
   */
  async refresh(input: RefreshInput): Promise<RefreshResult> {
    const rawToken = input.refreshToken;

    // Verify JWT cryptographic validity
    const payload = jwtService.verifyRefreshToken(rawToken);
    const tokenHash = hashToken(rawToken);

    // Look up token in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_TOKEN');
    }

    // Replay attack / reuse detection
    if (tokenRecord.revokedAt !== null) {
      if (tokenRecord.replacedBy !== null) {
        logger.warn(`Refresh token reuse detected for user ${tokenRecord.userId}. Invalidating all active tokens.`);
        // Revoke all tokens for this user
        await prisma.refreshToken.updateMany({
          where: {
            userId: tokenRecord.userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }
      throw new UnauthorizedError('Refresh token has already been used or revoked', 'TOKEN_REVOKED');
    }

    // Expiration check
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token has expired', 'TOKEN_EXPIRED');
    }

    // Issue rotated tokens
    const newAccessToken = jwtService.signAccessToken({
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
    });

    const newTokenId = crypto.randomUUID();
    const newRefreshToken = jwtService.signRefreshToken({
      userId: tokenRecord.user.id,
      tokenId: newTokenId,
    });

    const newExpiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

    // Rotate in a transaction: invalidate old token, persist new token
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          revokedAt: new Date(),
          replacedBy: newTokenId,
        },
      }),
      prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: tokenRecord.user.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    return {
      user: sanitizeUser(tokenRecord.user),
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  },

  /**
   * Invalidate session / refresh token.
   */
  async logout(userId?: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  },

  /**
   * Retrieve current user profile by verified user ID.
   */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return sanitizeUser(user);
  },
};
