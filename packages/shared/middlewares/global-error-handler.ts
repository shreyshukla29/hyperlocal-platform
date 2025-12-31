import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors';
import { logger } from '../logger';
import { HTTP_STATUS } from '../constants';

export function globalErrorHandler(err: Error, req: Request, res: Response, _next : NextFunction): Response {
  const context = req.context;
 
  if (err instanceof BaseError) {
    logger.error('Operational error', {
      context,
      errorCode: err.errorCode,
      message: err.message,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      data: null,
    });
  }

  logger.error('Unhandled exception', {
    context,
    error: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'something went wrong',
  });

  return res.status(500).json({
    success: false,
    error: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong',
    data: null,
  });
}
