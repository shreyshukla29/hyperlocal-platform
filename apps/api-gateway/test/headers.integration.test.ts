import request from 'supertest';
import { createApp } from '../src';

describe('Header enforcement', () => {
  it('rejects versioned routes without headers', async () => {
    const app = createApp();

    const res = await request(app).get('/v1/user/profile');

    expect(res.status).toBe(400);
  });
});
