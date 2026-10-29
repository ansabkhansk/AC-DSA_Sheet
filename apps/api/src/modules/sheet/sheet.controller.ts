import type { Request, Response } from 'express';
import * as sheetService from './sheet.service.js';

export async function getSheet(_req: Request, res: Response): Promise<void> {
  const sheet = await sheetService.getSheetTree();
  res.status(200).json({ success: true, data: { sheet } });
}

export async function getChapter(req: Request, res: Response): Promise<void> {
  const chapter = await sheetService.getChapterBySlug(req.params.slug);
  res.status(200).json({ success: true, data: { chapter } });
}

export async function getProblems(req: Request, res: Response): Promise<void> {
  const problems = await sheetService.listProblems({
    difficulty: req.query.difficulty as string | undefined,
    topic: req.query.topic as string | undefined,
  });
  res.status(200).json({ success: true, data: { problems } });
}
