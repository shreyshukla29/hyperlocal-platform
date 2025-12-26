import express from 'express';
import request from 'supertest';
import { errorMiddleware } from '../src/middleware';

describe('Error middleware', () => {
  it('returns safe error response', async () => {
    const app = express();

    app.get('/boom', () => {
      throw new Error('boom');
    });

    app.use(errorMiddleware);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.message).toBeDefined();
  });
});
