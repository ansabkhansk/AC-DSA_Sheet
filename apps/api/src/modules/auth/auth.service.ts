import bcrypt from 'bcryptjs';
import type { LoginInput, PublicUser, RegisterInput } from '@dsa/shared';
import { UserRole } from '@dsa/shared';
import { ApiError } from '../../utils/ApiError.js';
import { createRefreshToken, hashToken } from '../../utils/crypto.js';
import { signAccessToken } from '../../utils/jwt.js';
import { UserModel, type UserDocument } from '../users/user.model.js';
import { RefreshTokenModel } from './refresh-token.model.js';

const BCRYPT_COST = 10;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid email or password';

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as PublicUser['role'],
  };
}

async function issueTokenPair(user: UserDocument) {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role as PublicUser['role'],
  });

  const refreshToken = createRefreshToken();
  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new ApiError(409, 'CONFLICT', 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  try {
    const user = await UserModel.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: UserRole.student,
    });
    return issueTokenPair(user);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'CONFLICT', 'Email is already registered');
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase();
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS);
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS);
  }

  return issueTokenPair(user);
}

export async function refreshSession(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash });
  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    if (stored) {
      await RefreshTokenModel.deleteOne({ _id: stored._id });
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  const user = await UserModel.findById(stored.userId);
  if (!user) {
    await RefreshTokenModel.deleteOne({ _id: stored._id });
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  // Rotate: invalidate the presented refresh token before issuing a new pair.
  await RefreshTokenModel.deleteOne({ _id: stored._id });
  return issueTokenPair(user);
}

export async function logoutUser(rawRefreshToken: string | undefined) {
  if (rawRefreshToken) {
    await RefreshTokenModel.deleteOne({ tokenHash: hashToken(rawRefreshToken) });
  }
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
  }
  return toPublicUser(user);
}
