import { BaseError } from './base.error.js';

/* ------------------------------- 400 ------------------------------- */
export class BadRequestError extends BaseError {
  statusCode = 400;
  errorCode = 'BAD_REQUEST';
}

/* ------------------------------- 401 ------------------------------- */
export class UnauthorizedError extends BaseError {
  statusCode = 401;
  errorCode = 'UNAUTHORIZED';
}

/* ------------------------------- 403 ------------------------------- */
export class ForbiddenError extends BaseError {
  statusCode = 403;
  errorCode = 'FORBIDDEN';
}

/* ------------------------------- 404 ------------------------------- */
export class NotFoundError extends BaseError {
  statusCode = 404;
  errorCode = 'NOT_FOUND';
}

/* ------------------------------- 409 ------------------------------- */
export class ConflictError extends BaseError {
  statusCode = 409;
  errorCode = 'CONFLICT';
}

/* ------------------------------- 422 ------------------------------- */
export class ValidationError extends BaseError {
  statusCode = 422;
  errorCode = 'VALIDATION_ERROR';
}
