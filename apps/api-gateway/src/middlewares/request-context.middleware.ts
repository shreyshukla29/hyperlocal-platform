import { Request, Response, NextFunction } from 'express';
import { HEADERS } from '../constants';

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId = req.header(HEADERS.CORRELATION_ID);
  const sessionId = req.header(HEADERS.SESSION_ID);

  if (!correlationId || !sessionId) {
    res.status(400).json({
      message: 'Missing mandatory headers',
    });
    return;
  }

  req.context = {
    correlationId,
    sessionId,
    startTime: Date.now(),
  };

  next();
}