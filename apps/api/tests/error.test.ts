import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('error middleware shape', () => {
  it('returns VALIDATION_ERROR details for invalid bodies', async () => {
    const response = await request(app).post('/api/v1/_test/validate').send({});
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
    });
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it('returns generic INTERNAL_ERROR without a stack for unexpected throws', async () => {
    const response = await request(app).get('/api/v1/_test/error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/Intentional test error|stack/i);
  });

  it('returns NOT_FOUND for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
