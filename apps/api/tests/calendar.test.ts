import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Difficulty, PlanStatus, ProgressStatus } from '@dsa/shared';
import { createApp } from '../src/app.js';
import { ACCESS_COOKIE } from '../src/utils/cookies.js';
import {
  formatUtcDateKey,
  parseDateKeyToUtc,
  shiftDateKey,
  toDateKey,
} from '../src/utils/timezone.js';
import { StudyPlanModel } from '../src/modules/calendar/plan.model.js';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model.js';
import { UserProgressModel } from '../src/modules/progress/progress.model.js';
import { ChapterModel } from '../src/modules/sheet/chapter.model.js';
import { ProblemModel } from '../src/modules/sheet/problem.model.js';
import { TopicModel } from '../src/modules/sheet/topic.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

const app = createApp();
let mongo: MongoMemoryServer;

type Seed = {
  chapterId: string;
  topicId: string;
  problemIds: string[];
};

let seed: Seed;

async function register(email: string) {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Calendar User', email, password: 'password123' });
  expect(response.status).toBe(201);
  const cookie = response.headers['set-cookie'] as string[] | string | undefined;
  const list = Array.isArray(cookie) ? cookie : cookie ? [cookie] : [];
  const access = list.find((entry) => entry.startsWith(`${ACCESS_COOKIE}=`));
  expect(access).toBeTruthy();
  return access!.split(';')[0];
}

async function seedSheet(): Promise<Seed> {
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

  const problems = await ProblemModel.create(
    Array.from({ length: 5 }, (_, index) => ({
      topicId: topic._id,
      chapterId: chapter._id,
      title: `Problem ${index + 1}`,
      slug: `problem-${index + 1}`,
      difficulty: Difficulty.Easy,
      order: index + 1,
      resources: {
        youtube: 'https://www.youtube.com/watch?v=x',
        article: 'https://en.wikipedia.org/wiki/Array_data_structure',
        leetcode: 'https://leetcode.com/problems/two-sum/',
      },
    })),
  );

  return {
    chapterId: chapter._id.toString(),
    topicId: topic._id.toString(),
    problemIds: problems.map((problem) => problem._id.toString()),
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
    StudyPlanModel.deleteMany({}),
    ProblemModel.deleteMany({}),
    TopicModel.deleteMany({}),
    ChapterModel.deleteMany({}),
  ]);
  seed = await seedSheet();
});

describe('calendar date helpers (C7)', () => {
  it('stores YYYY-MM-DD as UTC midnight of that calendar day', () => {
    const stored = parseDateKeyToUtc('2026-11-01');
    expect(stored.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(formatUtcDateKey(stored)).toBe('2026-11-01');
  });

  it('uses local day for late-night IST when UTC is still the previous day', () => {
    // 2026-10-30 23:30 IST == 2026-10-30 18:00 UTC
    const istLate = new Date('2026-10-30T18:00:00.000Z');
    expect(toDateKey(istLate, 'Asia/Kolkata')).toBe('2026-10-30');
    expect(toDateKey(istLate, 'UTC')).toBe('2026-10-30');

    // 2026-10-31 00:30 IST == 2026-10-30 19:00 UTC — IST already next day
    const afterMidnightIst = new Date('2026-10-30T19:00:00.000Z');
    expect(toDateKey(afterMidnightIst, 'Asia/Kolkata')).toBe('2026-10-31');
    expect(toDateKey(afterMidnightIst, 'UTC')).toBe('2026-10-30');
  });

  it('shifts across month boundaries', () => {
    expect(shiftDateKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDateKey('2026-11-01', -1)).toBe('2026-10-31');
  });
});

describe('plans API', () => {
  it('requires auth on every plan route', async () => {
    const results = await Promise.all([
      request(app).get('/api/v1/plans?from=2026-11-01&to=2026-11-07'),
      request(app).post('/api/v1/plans').send({ date: '2026-11-01', title: 'Study' }),
      request(app)
        .post('/api/v1/plans/generate')
        .send({ startDate: '2026-11-01', endDate: '2026-11-03', perDay: 2 }),
      request(app).patch(`/api/v1/plans/${new mongoose.Types.ObjectId().toString()}`).send({
        title: 'x',
      }),
      request(app).delete(`/api/v1/plans/${new mongoose.Types.ObjectId().toString()}`),
    ]);
    for (const result of results) {
      expect(result.status).toBe(401);
    }
  });

  it('validates GET range and rejects unknown problemIds on create', async () => {
    const cookie = await register('plans-a@example.com');

    const inverted = await request(app)
      .get('/api/v1/plans?from=2026-11-10&to=2026-11-01')
      .set('Cookie', cookie);
    expect(inverted.status).toBe(400);

    const tooLong = await request(app)
      .get('/api/v1/plans?from=2026-01-01&to=2026-04-01')
      .set('Cookie', cookie);
    expect(tooLong.status).toBe(400);

    const badProblem = await request(app)
      .post('/api/v1/plans')
      .set('Cookie', cookie)
      .set('X-Timezone', 'Asia/Kolkata')
      .send({
        date: '2026-11-01',
        title: 'Broken',
        problemIds: [new mongoose.Types.ObjectId().toString()],
      });
    expect(badProblem.status).toBe(400);
  });

  it('creates, lists, updates, deletes plans and isolates users', async () => {
    const cookieA = await register('plans-b@example.com');
    const cookieB = await register('plans-c@example.com');

    const created = await request(app)
      .post('/api/v1/plans')
      .set('Cookie', cookieA)
      .set('X-Timezone', 'Asia/Kolkata')
      .send({
        date: '2026-11-01',
        title: 'Arrays day',
        problemIds: [seed.problemIds[0]],
      });
    expect(created.status).toBe(201);
    expect(created.body.data.plan.date).toBe('2026-11-01');
    expect(created.body.data.plan.status).toBe(PlanStatus.planned);
    const planId = created.body.data.plan.id as string;

    const listed = await request(app)
      .get('/api/v1/plans?from=2026-11-01&to=2026-11-07')
      .set('Cookie', cookieA)
      .set('X-Timezone', 'Asia/Kolkata');
    expect(listed.status).toBe(200);
    expect(listed.body.data.plans).toHaveLength(1);

    const foreign = await request(app)
      .get('/api/v1/plans?from=2026-11-01&to=2026-11-07')
      .set('Cookie', cookieB)
      .set('X-Timezone', 'Asia/Kolkata');
    expect(foreign.body.data.plans).toHaveLength(0);

    const steal = await request(app)
      .patch(`/api/v1/plans/${planId}`)
      .set('Cookie', cookieB)
      .send({ title: 'Hijack' });
    expect(steal.status).toBe(404);

    const updated = await request(app)
      .patch(`/api/v1/plans/${planId}`)
      .set('Cookie', cookieA)
      .set('X-Timezone', 'Asia/Kolkata')
      .send({ title: 'Arrays focus' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.plan.title).toBe('Arrays focus');

    const deleted = await request(app).delete(`/api/v1/plans/${planId}`).set('Cookie', cookieA);
    expect(deleted.status).toBe(200);

    const deletedAgain = await request(app)
      .delete(`/api/v1/plans/${planId}`)
      .set('Cookie', cookieA);
    expect(deletedAgain.status).toBe(404);
  });

  it('derives done and missed status from progress and date (C9)', async () => {
    const cookie = await register('plans-d@example.com');

    const past = await request(app)
      .post('/api/v1/plans')
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC')
      .send({
        date: '2020-01-01',
        title: 'Old plan',
        problemIds: [seed.problemIds[0]],
      });
    expect(past.body.data.plan.status).toBe(PlanStatus.missed);

    await request(app)
      .put(`/api/v1/progress/${seed.problemIds[0]}`)
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC')
      .send({ status: ProgressStatus.done });

    const listed = await request(app)
      .get('/api/v1/plans?from=2020-01-01&to=2020-01-02')
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC');
    expect(listed.body.data.plans[0].status).toBe(PlanStatus.done);
  });

  it('schedules +1/+3/+7 revisions on revisit without duplicates', async () => {
    const cookie = await register('plans-e@example.com');
    const today = toDateKey(new Date(), 'Asia/Kolkata');

    const first = await request(app)
      .put(`/api/v1/progress/${seed.problemIds[1]}`)
      .set('Cookie', cookie)
      .set('X-Timezone', 'Asia/Kolkata')
      .send({ status: ProgressStatus.revisit });
    expect(first.status).toBe(200);
    expect(first.body.data.revisions.created).toBe(3);

    const second = await request(app)
      .put(`/api/v1/progress/${seed.problemIds[1]}`)
      .set('Cookie', cookie)
      .set('X-Timezone', 'Asia/Kolkata')
      .send({ status: ProgressStatus.revisit });
    expect(second.body.data.revisions.created).toBe(0);

    const expectedDates = [1, 3, 7].map((offset) => shiftDateKey(today, offset));
    const plans = await StudyPlanModel.find({ kind: 'revision' }).lean();
    expect(plans).toHaveLength(3);
    expect(plans.map((plan) => formatUtcDateKey(plan.date)).sort()).toEqual(
      [...expectedDates].sort(),
    );
  });

  it('generates plans idempotently for unsolved unplanned problems', async () => {
    const cookie = await register('plans-f@example.com');

    await request(app)
      .put(`/api/v1/progress/${seed.problemIds[0]}`)
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC')
      .send({ status: ProgressStatus.done });

    const first = await request(app)
      .post('/api/v1/plans/generate')
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC')
      .send({ startDate: '2026-12-01', endDate: '2026-12-03', perDay: 2 });
    expect(first.status).toBe(200);
    expect(first.body.data.created).toBe(2);
    expect(first.body.data.problemsScheduled).toBe(4);

    const second = await request(app)
      .post('/api/v1/plans/generate')
      .set('Cookie', cookie)
      .set('X-Timezone', 'UTC')
      .send({ startDate: '2026-12-01', endDate: '2026-12-03', perDay: 2 });
    expect(second.body.data.created).toBe(0);

    const badPerDay = await request(app)
      .post('/api/v1/plans/generate')
      .set('Cookie', cookie)
      .send({ startDate: '2026-12-01', endDate: '2026-12-03', perDay: 50 });
    expect(badPerDay.status).toBe(400);
  });
});
