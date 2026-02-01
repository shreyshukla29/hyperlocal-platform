import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const API_RESPONSE = { success: true, error: null } as const;

export function sendSuccess<T>(res: Response, data: T, statusCode: number = StatusCodes.OK): Response {
  return res.status(statusCode).json({ ...API_RESPONSE, data });
}
