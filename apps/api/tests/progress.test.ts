import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Difficulty, ProgressStatus } from '@dsa/shared';
import { createApp } from '../src/app.js';
import { ACCESS_COOKIE } from '../src/utils/cookies.js';
import { ChapterModel } from '../src/modules/sheet/chapter.model.js';
import { ProblemModel } from '../src/modules/sheet/problem.model.js';
import { TopicModel } from '../src/modules/sheet/topic.model.js';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model.js';
import { UserProgressModel } from '../src/modules/progress/progress.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

const app = createApp();

let mongo: MongoMemoryServer;

type Seeded = {
  chapterId: string;
  topicId: string;
  easyId: string;
  mediumId: string;
  hardId: string;
  missingProblemId: string;
};

let seed: Seeded;

async function register(email: string, password = 'password123') {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password });
  expect(response.status).toBe(201);
  const cookie = response.headers['set-cookie'] as string[] | string | undefined;
  const list = Array.isArray(cookie) ? cookie : cookie ? [cookie] : [];
  const access = list.find((entry) => entry.startsWith(`${ACCESS_COOKIE}=`));
  expect(access).toBeTruthy();
  return access!.split(';')[0];
}

async function seedSheet(): Promise<Seeded> {
  const chapter = await ChapterModel.create({
    title: 'Arrays',
    slug: 'arrays',
    order: 1,
    description: 'Array chapter',
  });
  const topic = await TopicModel.create({
    chapterId: chapter._id,
    title: 'Basics',
    slug: 'basics',
    order: 1,
  });

  const [easy, medium, hard] = await ProblemModel.create([
    {
      topicId: topic._id,
      chapterId: chapter._id,
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.Easy,
      order: 1,
      resources: {
        youtube: 'https://www.youtube.com/watch?v=x',
        article: 'https://en.wikipedia.org/wiki/Array_data_structure',
        leetcode: 'https://leetcode.com/problems/two-sum/',
      },
    },
    {
      topicId: topic._id,
      chapterId: chapter._id,
      title: '3Sum',
      slug: '3sum',
      difficulty: Difficulty.Medium,
      order: 2,
      resources: {
        youtube: 'https://www.youtube.com/watch?v=y',
        article: 'https://en.wikipedia.org/wiki/Array_data_structure',
        leetcode: 'https://leetcode.com/problems/3sum/',
      },
    },
    {
      topicId: topic._id,
      chapterId: chapter._id,
      title: 'Trapping Rain Water',
      slug: 'trapping-rain-water',
      difficulty: Difficulty.Hard,
      order: 3,
      resources: {
        youtube: 'https://www.youtube.com/watch?v=z',
        article: 'https://en.wikipedia.org/wiki/Array_data_structure',
        leetcode: 'https://leetcode.com/problems/trapping-rain-water/',
      },
    },
  ]);

  return {
    chapterId: chapter._id.toString(),
    topicId: topic._id.toString(),
    easyId: easy._id.toString(),
    mediumId: medium._id.toString(),
    hardId: hard._id.toString(),
    missingProblemId: new mongoose.Types.ObjectId().toString(),
  };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    RefreshTokenModel.deleteMany({}),
    UserProgressModel.deleteMany({}),
    ProblemModel.deleteMany({}),
    TopicModel.deleteMany({}),
    ChapterModel.deleteMany({}),
  ]);
  seed = await seedSheet();
});

describe('progress API', () => {
  it('returns 401 for every progress route without auth', async () => {
    const routes = [
      request(app).get('/api/v1/progress/me'),
      request(app).get('/api/v1/progress/stats'),
      request(app).put(`/api/v1/progress/${seed.easyId}`).send({ status: ProgressStatus.done }),
      request(app).delete(`/api/v1/progress/${seed.easyId}`),
    ];
    const results = await Promise.all(routes);
    for (const result of results) {
      expect(result.status).toBe(401);
      expect(result.body.success).toBe(false);
    }
  });

  it('rejects invalid status and malformed problemId with 400', async () => {
    const cookie = await register('a@example.com');

    const badStatus = await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie)
      .send({ status: 'finished' });
    expect(badStatus.status).toBe(400);

    const badId = await request(app)
      .put('/api/v1/progress/not-an-object-id')
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });
    expect(badId.status).toBe(400);
  });

  it('returns 404 for unknown problem and creates no document', async () => {
    const cookie = await register('b@example.com');
    const response = await request(app)
      .put(`/api/v1/progress/${seed.missingProblemId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });

    expect(response.status).toBe(404);
    expect(await UserProgressModel.countDocuments()).toBe(0);
  });

  it('upserts idempotently including parallel PUTs and preserves completedAt', async () => {
    const cookie = await register('c@example.com');

    const first = await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });
    expect(first.status).toBe(200);
    const completedAt = first.body.data.progress.completedAt as string;

    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.revisit });
    expect(second.status).toBe(200);
    expect(second.body.data.progress.completedAt).toBe(completedAt);
    expect(second.body.data.progress.status).toBe(ProgressStatus.revisit);

    const parallel = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .put(`/api/v1/progress/${seed.mediumId}`)
          .set('Cookie', cookie)
          .send({ status: ProgressStatus.done }),
      ),
    );
    expect(parallel.every((result) => result.status === 200)).toBe(true);
    expect(await UserProgressModel.countDocuments({ problemId: seed.mediumId })).toBe(1);

    const me = await request(app).get('/api/v1/progress/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.completedProblemIds.sort()).toEqual([seed.easyId, seed.mediumId].sort());
    expect(me.body.data.lastActivity.problemId).toBe(seed.mediumId);
    expect(me.body.data.lastActivity.topicId).toBe(seed.topicId);
    expect(me.body.data.lastActivity.chapterId).toBe(seed.chapterId);
  });

  it('DELETE is idempotent and clears completion', async () => {
    const cookie = await register('d@example.com');
    await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });

    const firstDelete = await request(app)
      .delete(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie);
    expect(firstDelete.status).toBe(200);

    const secondDelete = await request(app)
      .delete(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie);
    expect(secondDelete.status).toBe(200);

    const me = await request(app).get('/api/v1/progress/me').set('Cookie', cookie);
    expect(me.body.data.completedProblemIds).toEqual([]);
  });

  it('isolates progress between two users', async () => {
    const cookieA = await register('user-a@example.com');
    const cookieB = await register('user-b@example.com');

    await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookieA)
      .send({ status: ProgressStatus.done });

    const meB = await request(app).get('/api/v1/progress/me').set('Cookie', cookieB);
    expect(meB.body.data.completedProblemIds).toEqual([]);

    const statsB = await request(app).get('/api/v1/progress/stats').set('Cookie', cookieB);
    expect(statsB.body.data.totals.solved).toBe(0);
  });

  it('returns hand-counted stats for a seeded fixture user', async () => {
    const cookie = await register('stats@example.com');

    await request(app)
      .put(`/api/v1/progress/${seed.easyId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });
    await request(app)
      .put(`/api/v1/progress/${seed.mediumId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.revisit });
    await request(app)
      .put(`/api/v1/progress/${seed.hardId}`)
      .set('Cookie', cookie)
      .send({ status: ProgressStatus.done });

    const stats = await request(app)
      .get('/api/v1/progress/stats')
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC');

    expect(stats.status).toBe(200);
    // Hand count: 3 solved (revisit counts — C8), 1 each difficulty, 3/3 in Arrays.
    expect(stats.body.data.totals.solved).toBe(3);
    expect(stats.body.data.totals.totalProblems).toBe(3);
    expect(stats.body.data.totals.byDifficulty).toEqual({
      Easy: 1,
      Medium: 1,
      Hard: 1,
    });
    expect(stats.body.data.totals.byChapter).toEqual([
      {
        chapterId: seed.chapterId,
        title: 'Arrays',
        slug: 'arrays',
        solved: 3,
        total: 3,
      },
    ]);
    expect(stats.body.data.streak).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.activity.length).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.lastActivity.chapterSlug).toBe('arrays');
  });
});
