import type { Request, Response } from 'express';
import { resolveTimezone } from '../../utils/timezone.js';
import * as calendarService from './calendar.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await calendarService.listPlans(
    req.user!.id,
    req.query.from as string,
    req.query.to as string,
    timeZone,
  );
  res.status(200).json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await calendarService.createPlan(req.user!.id, req.body, timeZone);
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await calendarService.updatePlan(req.user!.id, req.params.id, req.body, timeZone);
  res.status(200).json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await calendarService.deletePlan(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: { ok: true } });
}

export async function generate(req: Request, res: Response): Promise<void> {
  const timeZone = resolveTimezone(req.headers['x-timezone']);
  const data = await calendarService.generatePlans(req.user!.id, req.body, timeZone);
  res.status(200).json({ success: true, data });
}
