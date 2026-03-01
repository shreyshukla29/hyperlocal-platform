import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/index.js';

type ValidateSource = 'body' | 'query';

function validateSchema<T>(schema: ZodSchema<T>, source: ValidateSource) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : req.query;
    const result = schema.safeParse(data);

    if (!result.success) {
      const message = source === 'body' ? 'Invalid request payload' : 'Invalid query parameters';
      throw new BadRequestError(message, {
        issues: result.error.flatten(),
      });
    }

    next();
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return validateSchema(schema, 'body');
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateSchema(schema, 'query');
}