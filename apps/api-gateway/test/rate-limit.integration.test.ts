import request from 'supertest';
import { createApp } from '../src';

describe('Rate limiting', () => {
  it('limits requests globally', async () => {
    const app = createApp();

    for (let i = 0; i < 100; i++) {
      await request(app).get('/health');
    }

    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
  });
});
