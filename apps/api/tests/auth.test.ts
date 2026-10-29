import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../src/utils/cookies.js';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

const app = createApp();
let mongo: MongoMemoryServer;

function cookieValue(setCookie: string[] | string | undefined, name: string): string | null {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const match = list.find((entry) => entry.startsWith(`${name}=`));
  return match ? match.split(';')[0] : null;
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
  await Promise.all([UserModel.deleteMany({}), RefreshTokenModel.deleteMany({})]);
});

describe('auth API', () => {
  it('registers, logs in, refreshes with rotation, rejects reuse, and logs out', async () => {
    const register = await request(app).post('/api/v1/auth/register').send({
      name: 'Auth User',
      email: 'Auth.User@Example.com',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    expect(register.body.data.user.email).toBe('auth.user@example.com');
    expect(register.body.data.user.passwordHash).toBeUndefined();

    const access1 = cookieValue(register.headers['set-cookie'], ACCESS_COOKIE);
    const refresh1 = cookieValue(register.headers['set-cookie'], REFRESH_COOKIE);
    expect(access1).toBeTruthy();
    expect(refresh1).toBeTruthy();

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', access1!);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('auth.user@example.com');

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'auth.user@example.com',
      password: 'password123',
    });
    expect(login.status).toBe(200);
    const refresh2 = cookieValue(login.headers['set-cookie'], REFRESH_COOKIE)!;

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refresh2);
    expect(refreshed.status).toBe(200);
    const refresh3 = cookieValue(refreshed.headers['set-cookie'], REFRESH_COOKIE)!;
    expect(refresh3).not.toBe(refresh2);

    const reuse = await request(app).post('/api/v1/auth/refresh').set('Cookie', refresh2);
    expect(reuse.status).toBe(401);

    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', refresh3);
    expect(logout.status).toBe(200);

    const afterLogout = await request(app).post('/api/v1/auth/refresh').set('Cookie', refresh3);
    expect(afterLogout.status).toBe(401);
  });

  it('rejects duplicate email and wrong password with safe messages', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'dup@example.com',
      password: 'password123',
    });

    const dup = await request(app).post('/api/v1/auth/register').send({
      name: 'B',
      email: 'DUP@example.com',
      password: 'password123',
    });
    expect(dup.status).toBe(409);

    const bad = await request(app).post('/api/v1/auth/login').send({
      email: 'dup@example.com',
      password: 'wrong-password',
    });
    expect(bad.status).toBe(401);
    expect(bad.body.error.message).toBe('Invalid email or password');
  });
});
