import type { Request, Response } from 'express';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../../utils/cookies.js';
import * as authService from './auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.registerUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({ success: true, data: { user: result.user } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.loginUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({ success: true, data: { user: result.user } });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refreshSession(req.cookies?.[REFRESH_COOKIE]);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({ success: true, data: { user: result.user } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logoutUser(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  res.status(200).json({ success: true, data: { ok: true } });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ success: true, data: { user } });
}
