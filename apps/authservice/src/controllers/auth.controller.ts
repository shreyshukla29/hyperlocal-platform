import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@hyperlocal/shared/logger';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { AuthService } from '../services/index.js';

import {
  SignupRequest,
  LoginWithEmailRequest,
  LoginWithPhoneRequest,
  SendVerificationRequest,
  VerifyRequest,
} from '../types/index.js';
import { ServerConfig } from '../config/index.js';

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
        data: result.data,
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
        data: result.data,
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
        data: result.data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendVerification(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const identityId = getAuthIdentityIdFromRequest(req.headers);
      if (!identityId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          data: null,
          error: 'Authentication required',
        });
      }
      const payload = req.body as SendVerificationRequest;
      await this.authService.sendVerification(identityId, payload);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { success: true },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const payload = req.body as VerifyRequest;
      await this.authService.verify(payload);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { success: true },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
