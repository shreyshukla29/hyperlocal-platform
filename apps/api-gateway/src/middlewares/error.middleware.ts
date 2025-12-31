import { Request, Response } from 'express';
import { GatewayError } from '../errors';
import { logger } from '@hyperlocal/shared/logger';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
_next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal gateway error';

  if (err instanceof GatewayError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (err instanceof Error && statusCode === 500) {
    message = err.message;
  }

  logger.error('Gateway request failed', {
    statusCode,
    errorMessage: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined,

    correlationId: req.context?.correlationId,
    sessionId: req.context?.sessionId,
    userId: req.context?.user?.sub,

    method: req.method,
    path: req.originalUrl,
  });

  res.status(statusCode).json({
    message,
    correlationId: req.context?.correlationId,
  });
}
