import type { Request, Response } from 'express';
import { resolveTimezone } from '../../utils/timezone.js';
import * as progressService from './progress.service.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  const data = await progressService.getMyProgress(req.user!.id);
  res.status(200).json({ success: true, data });
}

export async function upsert(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await progressService.upsertProgress(
    req.user!.id,
    req.params.problemId,
    req.body.status,
    timeZone,
  );
  res.status(200).json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await progressService.deleteProgress(req.user!.id, req.params.problemId);
  res.status(200).json({ success: true, data: { ok: true } });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await progressService.getProgressStats(req.user!.id, timeZone);
  res.status(200).json({ success: true, data });
}
