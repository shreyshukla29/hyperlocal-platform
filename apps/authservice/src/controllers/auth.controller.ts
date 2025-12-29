import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@hyperlocal/shared/logger';
import { AuthService } from '../services';

import { SignupRequest, LoginWithEmailRequest, LoginWithPhoneRequest } from '../types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signup(req: Request, res: Response): Promise<Response> {
    const context = req.context;

    const payload: SignupRequest = req.body;

    const result = await this.authService.signup(payload, context);

    logger.info('Signup successful', {
      context,
      userId: result.userId,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
      error: null,
    });
  }

  async loginWithEmail(req: Request, res: Response): Promise<Response> {
    const context = req.context;

    const payload: LoginWithEmailRequest = req.body;

    const result = await this.authService.loginWithEmail(payload, context);

    logger.info('Login with email successful', {
      context,
      userId: result.userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      error: null,
    });
  }

  async loginWithPhone(req: Request, res: Response): Promise<Response> {
    const context = req.context;

    const payload: LoginWithPhoneRequest = req.body;

    const result = await this.authService.loginWithPhone(payload, context);

    logger.info('Login with phone successful', {
      context,
      userId: result.userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      error: null,
    });
  }
}
