import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { jwtAuthMiddleware } from '../src/gateway/auth';

jest.spyOn(jwt, 'verify').mockReturnValue({
  sub: 'user-1',
  email: 'test@test.com',
  roles: ['user'],
  iat: 0,
  exp: 999999,
});

describe('JWT middleware', () => {
  it('attaches user to request context', () => {
    const req = {
      cookies: { access_token: 'token' },
      context: { correlationId: 'c1', sessionId: 's1' },
    } as unknown as Request;

    const next = jest.fn();

    jwtAuthMiddleware(req, {} as Response, next);

    expect(req.context.user?.sub).toBe('user-1');
    expect(next).toHaveBeenCalled();
  });
});
