import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@hyperlocal/shared/logger';
import { AuthService } from '../services';

import { SignupRequest, LoginWithEmailRequest, LoginWithPhoneRequest } from '../types';
import { ServerConfig } from '../config';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signup(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const context = req.context;

      const payload: SignupRequest = req.body;

      const result = await this.authService.signup(payload);

      logger.info('Signup successful', {
        context,
        userId: result.userId,
      });

        res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: ServerConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, 
    });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithEmail(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const context = req.context;
      const payload: LoginWithEmailRequest = req.body;

      const result = await this.authService.loginWithEmail(payload);

      logger.info('Login with email successful', {
        context,
        userId: result.userId,
      });

        res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: ServerConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

  async loginWithPhone(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const context = req.context;
      const payload: LoginWithPhoneRequest = req.body;

      const result = await this.authService.loginWithPhone(payload);

      logger.info('Login with phone successful', {
        context,
        userId: result.userId,
      });

        res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: ServerConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
