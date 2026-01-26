import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors';


export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestError('Invalid request payload', {
        issues: result.error.flatten(),
      });
    }

    next();
  };
}