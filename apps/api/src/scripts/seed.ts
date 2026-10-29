import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheetSeedSchema, type SheetSeed } from '@dsa/shared';
import { connectDb, disconnectDb } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { ChapterModel } from '../modules/sheet/chapter.model.js';
import { ProblemModel } from '../modules/sheet/problem.model.js';
import { TopicModel } from '../modules/sheet/topic.model.js';
import { invalidateSheetCache } from '../utils/cache.js';

function resolveSeedPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, '../data/sheet-seed.json'),
    path.join(here, '../../src/data/sheet-seed.json'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`sheet-seed.json not found. Tried: ${candidates.join(', ')}`);
}

function loadSeed(): SheetSeed {
  const seedPath = resolveSeedPath();
  const raw = JSON.parse(readFileSync(seedPath, 'utf8')) as unknown;
  const parsed = sheetSeedSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    console.error('Invalid sheet seed JSON:\n' + details);
    process.exit(1);
  }
  return parsed.data;
}

async function seedSheet(seed: SheetSeed): Promise<void> {
  let chapterCount = 0;
  let topicCount = 0;
  let problemCount = 0;

  for (const chapterData of seed.chapters) {
    const chapter = await ChapterModel.findOneAndUpdate(
      { slug: chapterData.slug },
      {
        $set: {
          title: chapterData.title,
          slug: chapterData.slug,
          order: chapterData.order,
          description: chapterData.description,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    chapterCount += 1;

    for (const topicData of chapterData.topics) {
      const topic = await TopicModel.findOneAndUpdate(
        { chapterId: chapter._id, slug: topicData.slug },
        {
          $set: {
            chapterId: chapter._id,
            title: topicData.title,
            slug: topicData.slug,
            order: topicData.order,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      topicCount += 1;

      for (const problemData of topicData.problems) {
        // chapterId is copied onto each problem so chapter stats do not need a join.
        if (topic.chapterId.toString() !== chapter._id.toString()) {
          throw new Error(
            `Topic ${topicData.slug} chapter mismatch while seeding problem ${problemData.slug}`,
          );
        }

        await ProblemModel.findOneAndUpdate(
          { slug: problemData.slug },
          {
            $set: {
              topicId: topic._id,
              chapterId: chapter._id,
              title: problemData.title,
              slug: problemData.slug,
              difficulty: problemData.difficulty,
              order: problemData.order,
              resources: problemData.resources,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        problemCount += 1;
      }
    }
  }

  await Promise.all([
    ChapterModel.syncIndexes(),
    TopicModel.syncIndexes(),
    ProblemModel.syncIndexes(),
  ]);

  const [chapters, topics, problems] = await Promise.all([
    ChapterModel.countDocuments(),
    TopicModel.countDocuments(),
    ProblemModel.countDocuments(),
  ]);

  logger.info(
    {
      upserted: { chapterCount, topicCount, problemCount },
      totals: { chapters, topics, problems },
    },
    'Sheet seed complete',
  );
}

async function main(): Promise<void> {
  const seed = loadSeed();
  await connectDb();
  await connectRedis();
  try {
    await seedSheet(seed);
    await invalidateSheetCache();
  } finally {
    await disconnectRedis();
    await disconnectDb();
  }
}

main().catch((error) => {
  logger.error({ err: error }, 'Sheet seed failed');
  process.exit(1);
});
