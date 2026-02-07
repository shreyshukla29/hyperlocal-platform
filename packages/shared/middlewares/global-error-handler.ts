import type { ErrorRequestHandler, Request } from 'express';
import { BaseError } from '../errors/index.js';
import { logger } from '../logger/index.js';
import { HTTP_STATUS } from '../constants/index.js';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const context = (req as Request & { context?: unknown }).context;
  if (err instanceof BaseError) {
    logger.error('Operational error', {
      context,
      errorCode: err.errorCode,
      message: err.message,
    });
    res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      data: null,
    });
    return;
  }

  logger.error('Unhandled exception', {
    context,
    error: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: `something went wrong: ${err}`,
  });
  res.status(500).json({
    success: false,
    error: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong',
    data: null,
  });
};
