import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Difficulty } from '@dsa/shared';
import { createApp } from '../src/app.js';
import { invalidateSheetCache } from '../src/utils/cache.js';
import { ChapterModel } from '../src/modules/sheet/chapter.model.js';
import { ProblemModel } from '../src/modules/sheet/problem.model.js';
import { TopicModel } from '../src/modules/sheet/topic.model.js';

const app = createApp();
let mongo: MongoMemoryServer;

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
    ChapterModel.deleteMany({}),
    TopicModel.deleteMany({}),
    ProblemModel.deleteMany({}),
  ]);
  await invalidateSheetCache();

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
  await ProblemModel.create({
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
  });
});

describe('GET /sheet caching headers (Redis disabled in tests)', () => {
  it('returns Cache-Control, ETag, X-Cache MISS, and supports If-None-Match 304', async () => {
    const first = await request(app).get('/api/v1/sheet');
    expect(first.status).toBe(200);
    expect(first.headers['cache-control']).toBe('public, max-age=300');
    expect(first.headers['x-cache']).toBe('MISS');
    expect(first.headers.etag).toBeTruthy();
    expect(first.body.data.sheet).toHaveLength(1);

    const second = await request(app)
      .get('/api/v1/sheet')
      .set('If-None-Match', first.headers.etag);
    expect(second.status).toBe(304);
    expect(second.headers['cache-control']).toBe('public, max-age=300');
    expect(second.headers.etag).toBe(first.headers.etag);
  });
});
