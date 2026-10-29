import mongoose from 'mongoose';
import { Difficulty, type ProgressStatus } from '@dsa/shared';
import { ApiError } from '../../utils/ApiError.js';
import { computeStreak, shiftDateKey, toDateKey } from '../../utils/timezone.js';
import { ChapterModel } from '../sheet/chapter.model.js';
import { ProblemModel } from '../sheet/problem.model.js';
import { UserModel } from '../users/user.model.js';
import { UserProgressModel } from './progress.model.js';

type LastActivityPayload = {
  problemId: string;
  topicId: string;
  chapterId: string;
  chapterSlug?: string;
  problemSlug?: string;
  at: string;
};

async function enrichLastActivity(
  lastActivity:
    | {
        problemId?: mongoose.Types.ObjectId | null;
        topicId?: mongoose.Types.ObjectId | null;
        chapterId?: mongoose.Types.ObjectId | null;
        at?: Date | null;
      }
    | null
    | undefined,
): Promise<LastActivityPayload | null> {
  if (
    !lastActivity?.problemId ||
    !lastActivity.topicId ||
    !lastActivity.chapterId ||
    !lastActivity.at
  ) {
    return null;
  }

  const [chapter, problem] = await Promise.all([
    ChapterModel.findById(lastActivity.chapterId).select('slug').lean(),
    ProblemModel.findById(lastActivity.problemId).select('slug').lean(),
  ]);

  return {
    problemId: lastActivity.problemId.toString(),
    topicId: lastActivity.topicId.toString(),
    chapterId: lastActivity.chapterId.toString(),
    chapterSlug: chapter?.slug,
    problemSlug: problem?.slug,
    at: lastActivity.at.toISOString(),
  };
}

export async function getMyProgress(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [rows, user] = await Promise.all([
    UserProgressModel.find({ userId: userObjectId }).select('problemId').lean(),
    UserModel.findById(userObjectId).select('lastActivity').lean(),
  ]);

  return {
    completedProblemIds: rows.map((row) => row.problemId.toString()),
    lastActivity: await enrichLastActivity(user?.lastActivity),
  };
}

export async function upsertProgress(userId: string, problemId: string, status: ProgressStatus) {
  const problem = await ProblemModel.findById(problemId).lean();
  if (!problem) {
    throw new ApiError(404, 'NOT_FOUND', 'Problem not found');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const problemObjectId = problem._id;

  // completedAt is set only on insert so repeated PUTs stay idempotent.
  const progress = await UserProgressModel.findOneAndUpdate(
    { userId: userObjectId, problemId: problemObjectId },
    {
      $set: {
        status,
        topicId: problem.topicId,
        chapterId: problem.chapterId,
      },
      $setOnInsert: {
        userId: userObjectId,
        problemId: problemObjectId,
        completedAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  const at = new Date();
  await UserModel.updateOne(
    { _id: userObjectId },
    {
      $set: {
        lastActivity: {
          problemId: problemObjectId,
          topicId: problem.topicId,
          chapterId: problem.chapterId,
          at,
        },
      },
    },
  );

  return {
    progress: {
      id: progress._id.toString(),
      problemId: progress.problemId.toString(),
      topicId: progress.topicId.toString(),
      chapterId: progress.chapterId.toString(),
      status: progress.status,
      completedAt: progress.completedAt.toISOString(),
    },
    lastActivity: {
      problemId: problemObjectId.toString(),
      topicId: problem.topicId.toString(),
      chapterId: problem.chapterId.toString(),
      at: at.toISOString(),
    },
  };
}

export async function deleteProgress(userId: string, problemId: string) {
  await UserProgressModel.deleteOne({
    userId: new mongoose.Types.ObjectId(userId),
    problemId: new mongoose.Types.ObjectId(problemId),
  });
}

export async function getProgressStats(userId: string, timeZone: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [progressRows, problems, chapters, user] = await Promise.all([
    UserProgressModel.find({ userId: userObjectId }).lean(),
    ProblemModel.find({}).select('_id difficulty chapterId').lean(),
    ChapterModel.find({}).select('_id title slug order').sort({ order: 1 }).lean(),
    UserModel.findById(userObjectId).select('lastActivity').lean(),
  ]);

  const completedIds = new Set(progressRows.map((row) => row.problemId.toString()));

  const byDifficulty: Record<string, number> = {
    [Difficulty.Easy]: 0,
    [Difficulty.Medium]: 0,
    [Difficulty.Hard]: 0,
  };

  const solvedByChapter = new Map<string, number>();
  const totalByChapter = new Map<string, number>();

  for (const chapter of chapters) {
    const id = chapter._id.toString();
    solvedByChapter.set(id, 0);
    totalByChapter.set(id, 0);
  }

  for (const problem of problems) {
    const chapterId = problem.chapterId.toString();
    totalByChapter.set(chapterId, (totalByChapter.get(chapterId) ?? 0) + 1);

    if (!completedIds.has(problem._id.toString())) {
      continue;
    }

    byDifficulty[problem.difficulty] = (byDifficulty[problem.difficulty] ?? 0) + 1;
    solvedByChapter.set(chapterId, (solvedByChapter.get(chapterId) ?? 0) + 1);
  }

  const activityMap = new Map<string, number>();
  for (const row of progressRows) {
    const key = toDateKey(row.completedAt, timeZone);
    activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
  }

  // Sparse activity for the last 365 local calendar days (C11).
  const todayKey = toDateKey(new Date(), timeZone);
  const oldestKey = shiftDateKey(todayKey, -364);
  const activity = [...activityMap.entries()]
    .filter(([date]) => date >= oldestKey && date <= todayKey)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totals: {
      solved: progressRows.length,
      totalProblems: problems.length,
      byDifficulty,
      byChapter: chapters.map((chapter) => {
        const id = chapter._id.toString();
        return {
          chapterId: id,
          title: chapter.title,
          slug: chapter.slug,
          solved: solvedByChapter.get(id) ?? 0,
          total: totalByChapter.get(id) ?? 0,
        };
      }),
    },
    streak: computeStreak(activityMap.keys(), timeZone),
    activity,
    lastActivity: await enrichLastActivity(user?.lastActivity),
  };
}
