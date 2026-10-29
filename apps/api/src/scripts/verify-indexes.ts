import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Difficulty, PlanStatus, ProgressStatus } from '@dsa/shared';
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { StudyPlanModel } from '../modules/calendar/plan.model.js';
import { UserProgressModel } from '../modules/progress/progress.model.js';
import { ChapterModel } from '../modules/sheet/chapter.model.js';
import { ProblemModel } from '../modules/sheet/problem.model.js';
import { TopicModel } from '../modules/sheet/topic.model.js';
import { UserModel } from '../modules/users/user.model.js';

type ExplainSummary = {
  name: string;
  collection: string;
  query: Record<string, unknown>;
  winningPlanStage: string;
  indexName: string | null;
  stageChain: string[];
  docsExamined: number | null;
  keysExamined: number | null;
  hasCollScan: boolean;
  hasIxScan: boolean;
};

function collectStages(node: unknown, stages: string[] = []): string[] {
  if (!node || typeof node !== 'object') {
    return stages;
  }
  const record = node as Record<string, unknown>;
  if (typeof record.stage === 'string') {
    stages.push(record.stage);
  }
  if (record.inputStage) {
    collectStages(record.inputStage, stages);
  }
  if (Array.isArray(record.inputStages)) {
    for (const child of record.inputStages) {
      collectStages(child, stages);
    }
  }
  return stages;
}

function findIndexName(node: unknown): string | null {
  if (!node || typeof node !== 'object') {
    return null;
  }
  const record = node as Record<string, unknown>;
  if (record.stage === 'IXSCAN' && typeof record.indexName === 'string') {
    return record.indexName;
  }
  if (record.inputStage) {
    const nested = findIndexName(record.inputStage);
    if (nested) return nested;
  }
  if (Array.isArray(record.inputStages)) {
    for (const child of record.inputStages) {
      const nested = findIndexName(child);
      if (nested) return nested;
    }
  }
  return null;
}

function summarize(
  name: string,
  collection: string,
  query: Record<string, unknown>,
  explain: Record<string, unknown>,
): ExplainSummary {
  const queryPlanner = explain.queryPlanner as Record<string, unknown> | undefined;
  const winningPlan = queryPlanner?.winningPlan as Record<string, unknown> | undefined;
  const execStats = explain.executionStats as Record<string, unknown> | undefined;
  const stageChain = collectStages(winningPlan);

  return {
    name,
    collection,
    query,
    winningPlanStage: typeof winningPlan?.stage === 'string' ? winningPlan.stage : 'unknown',
    indexName: findIndexName(winningPlan),
    stageChain,
    docsExamined: typeof execStats?.totalDocsExamined === 'number' ? execStats.totalDocsExamined : null,
    keysExamined: typeof execStats?.totalKeysExamined === 'number' ? execStats.totalKeysExamined : null,
    hasCollScan: stageChain.includes('COLLSCAN'),
    hasIxScan: stageChain.includes('IXSCAN'),
  };
}

async function explainFind(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>,
  query: Record<string, unknown>,
): Promise<ExplainSummary> {
  const explain = (await model.find(query).lean().explain('executionStats')) as unknown as Record<
    string,
    unknown
  >;
  return summarize(name, model.collection.name, query, explain);
}

async function main(): Promise<void> {
  await connectDb();

  await Promise.all([
    UserProgressModel.syncIndexes(),
    StudyPlanModel.syncIndexes(),
    TopicModel.syncIndexes(),
    ProblemModel.syncIndexes(),
    ChapterModel.syncIndexes(),
    UserModel.syncIndexes(),
  ]);

  const marker = `p8-index-verify-${Date.now()}`;
  const user = await UserModel.create({
    name: 'Index Verify',
    email: `${marker}@example.com`,
    passwordHash: 'not-a-real-hash',
  });
  const chapter = await ChapterModel.create({
    title: 'Verify',
    slug: marker,
    order: 9999,
    description: 'Temporary chapter for index explain',
  });
  const topic = await TopicModel.create({
    chapterId: chapter._id,
    title: 'Verify topic',
    slug: `${marker}-topic`,
    order: 1,
  });
  const problem = await ProblemModel.create({
    topicId: topic._id,
    chapterId: chapter._id,
    title: 'Verify problem',
    slug: `${marker}-problem`,
    difficulty: Difficulty.Easy,
    order: 1,
    resources: {
      youtube: 'https://www.youtube.com/watch?v=x',
      article: 'https://en.wikipedia.org/wiki/Array_data_structure',
      leetcode: 'https://leetcode.com/problems/two-sum/',
    },
  });
  await UserProgressModel.create({
    userId: user._id,
    problemId: problem._id,
    topicId: topic._id,
    chapterId: chapter._id,
    status: ProgressStatus.done,
    completedAt: new Date(),
  });
  await StudyPlanModel.create({
    userId: user._id,
    date: new Date('2026-11-15T00:00:00.000Z'),
    title: 'Verify plan',
    problemIds: [problem._id],
    status: PlanStatus.planned,
    kind: 'study',
  });

  const from = new Date('2026-11-01T00:00:00.000Z');
  const to = new Date('2026-11-30T00:00:00.000Z');

  try {
    const results: ExplainSummary[] = [
      await explainFind('progress_by_user_problem', UserProgressModel, {
        userId: user._id,
        problemId: problem._id,
      }),
      await explainFind('progress_by_user_chapter', UserProgressModel, {
        userId: user._id,
        chapterId: chapter._id,
      }),
      await explainFind('progress_by_user_completedAt', UserProgressModel, {
        userId: user._id,
        completedAt: { $gte: from },
      }),
      await explainFind('plans_by_user_date_range', StudyPlanModel, {
        userId: user._id,
        date: { $gte: from, $lte: to },
      }),
      await explainFind('topics_by_chapter_order', TopicModel, {
        chapterId: chapter._id,
      }),
      await explainFind('problems_by_topic_order', ProblemModel, {
        topicId: topic._id,
      }),
    ];

    const failures = results.filter((result) => result.hasCollScan || !result.hasIxScan);

    const outDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../docs',
    );
    mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'index-explain.json');
    writeFileSync(
      outPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          results,
          ok: failures.length === 0,
        },
        null,
        2,
      ),
    );

    for (const result of results) {
      logger.info(
        {
          name: result.name,
          hasIxScan: result.hasIxScan,
          hasCollScan: result.hasCollScan,
          indexName: result.indexName,
          stages: result.stageChain,
        },
        'Index explain summary',
      );
    }

    if (failures.length > 0) {
      logger.error({ failures: failures.map((item) => item.name) }, 'COLLSCAN or missing IXSCAN');
      process.exitCode = 1;
    } else {
      logger.info({ outPath }, 'Index verification passed');
    }
  } finally {
    await Promise.all([
      UserProgressModel.deleteMany({ userId: user._id }),
      StudyPlanModel.deleteMany({ userId: user._id }),
      ProblemModel.deleteOne({ _id: problem._id }),
      TopicModel.deleteOne({ _id: topic._id }),
      ChapterModel.deleteOne({ _id: chapter._id }),
      UserModel.deleteOne({ _id: user._id }),
    ]);
    await disconnectDb();
  }
}

main().catch(async (error) => {
  logger.error({ err: error }, 'Index verification failed');
  try {
    await disconnectDb();
  } catch {
    // ignore
  }
  process.exit(1);
});
