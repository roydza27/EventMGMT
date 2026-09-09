import { UserRole } from '@eventmgmt/shared';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  college: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshResult {
  user: AuthUser;
  tokens: AuthTokens;
}
