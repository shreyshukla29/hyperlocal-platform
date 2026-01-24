import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ServerConfig } from '../config';
import { JwtPayload } from '../types';
import {logger} from '@hyperlocal/shared/logger'
import { GatewayError } from '../errors';

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }


  try {

    const payload = jwt.verify(token, ServerConfig.JWT_SECRET) as JwtPayload;
    req.context.user = payload;
    logger.info('JWT authenticated', {
      correlationId: req.context.correlationId,
      sessionId: req.context.sessionId,
      userId: payload.userId,
    });
    next();
  } catch (error) {
    logger.error('JWT verification failed', {
      correlationId: req.context?.correlationId,
      sessionId: req.context?.sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new GatewayError('Invalid or expired token', 401);
  }
}
