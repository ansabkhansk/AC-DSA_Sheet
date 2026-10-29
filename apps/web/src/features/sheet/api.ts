import type { Difficulty } from '@dsa/shared';
import { http } from '../../lib/http';

export type ProblemResources = {
  youtube: string;
  article: string;
  leetcode?: string;
  codeforces?: string;
};

export type SheetProblem = {
  id: string;
  topicId: string;
  chapterId: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  order: number;
  resources: ProblemResources;
};

export type SheetTopic = {
  id: string;
  chapterId: string;
  title: string;
  slug: string;
  order: number;
  problems: SheetProblem[];
};

export type SheetChapter = {
  id: string;
  title: string;
  slug: string;
  order: number;
  description: string;
  topics: SheetTopic[];
};

type ApiSuccess<T> = { success: true; data: T };

export async function fetchSheet(): Promise<SheetChapter[]> {
  const { data } = await http.get<ApiSuccess<{ sheet: SheetChapter[] }>>('/api/v1/sheet');
  return data.data.sheet;
}
