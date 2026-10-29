import type { Request, Response } from 'express';
import {
  computeEtag,
  getCachedSheet,
  setCachedSheet,
} from '../../utils/cache.js';
import * as sheetService from './sheet.service.js';

export async function getSheet(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'public, max-age=300');

  const cached = await getCachedSheet();
  if (cached) {
    res.setHeader('ETag', cached.etag);
    res.setHeader('X-Cache', 'HIT');
    if (req.headers['if-none-match'] === cached.etag) {
      res.status(304).end();
      return;
    }
    res.status(200).type('json').send(cached.body);
    return;
  }

  const sheet = await sheetService.getSheetTree();
  const body = JSON.stringify({ success: true, data: { sheet } });
  const etag = computeEtag(body);

  await setCachedSheet(body, etag);

  res.setHeader('ETag', etag);
  res.setHeader('X-Cache', 'MISS');
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  res.status(200).type('json').send(body);
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
