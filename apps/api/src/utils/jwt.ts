import jwt from 'jsonwebtoken';
import type { UserRole } from '@dsa/shared';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

const ACCESS_TOKEN_TTL = '15m';

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.sub !== 'string' ||
      (decoded.role !== 'student' && decoded.role !== 'admin')
    ) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
    }
    return { sub: decoded.sub, role: decoded.role };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
  }
}
