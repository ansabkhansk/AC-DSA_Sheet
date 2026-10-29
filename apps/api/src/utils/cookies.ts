import type { Response } from 'express';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookie,
    maxAge: ACCESS_MAX_AGE_MS,
    path: '/',
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie,
    maxAge: REFRESH_MAX_AGE_MS,
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, {
    ...baseCookie,
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseCookie,
    path: '/api/v1/auth',
  });
}
