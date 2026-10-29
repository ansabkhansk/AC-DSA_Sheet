import type { LastActivity, ProgressStatus } from '@dsa/shared';
import { http } from '../../lib/http';

type ApiSuccess<T> = { success: true; data: T };

export type MyProgress = {
  completedProblemIds: string[];
  lastActivity: LastActivity | null;
};

export type ProgressStats = {
  totals: {
    solved: number;
    totalProblems: number;
    byDifficulty: Record<string, number>;
    byChapter: Array<{
      chapterId: string;
      title: string;
      slug: string;
      solved: number;
      total: number;
    }>;
  };
  streak: number;
  activity: Array<{ date: string; count: number }>;
  lastActivity: LastActivity | null;
};

export async function fetchMyProgress(): Promise<MyProgress> {
  const { data } = await http.get<ApiSuccess<MyProgress>>('/api/v1/progress/me');
  return data.data;
}

export async function fetchProgressStats(): Promise<ProgressStats> {
  const { data } = await http.get<ApiSuccess<ProgressStats>>('/api/v1/progress/stats');
  return data.data;
}

export async function upsertProgress(problemId: string, status: ProgressStatus): Promise<void> {
  await http.put(`/api/v1/progress/${problemId}`, { status });
}

export async function deleteProgress(problemId: string): Promise<void> {
  await http.delete(`/api/v1/progress/${problemId}`);
}
