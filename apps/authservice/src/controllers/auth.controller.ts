import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@hyperlocal/shared/logger';
import { AuthService } from '../services/index.js';
import {
  SignupRequest,
  LoginWithEmailRequest,
  LoginWithPhoneRequest,
  SendVerificationRequest,
  VerifyRequest,
  RefreshRequest,
} from '../types/index.js';
import { setAuthCookie } from '../utils/index.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload: SignupRequest = req.body;
      const result = await this.authService.signup(payload);

      logger.info('Signup successful', {
        context: req.context,
        authId: result.data.authId,
      });

      setAuthCookie(res, result.token);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          ...result.data,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload: LoginWithEmailRequest = req.body;
      const result = await this.authService.loginWithEmail(payload);

      logger.info('Login with email successful', {
        context: req.context,
        authId: result.data.authId,
      });

      setAuthCookie(res, result.token);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          ...result.data,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithPhone(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload: LoginWithPhoneRequest = req.body;
      const result = await this.authService.loginWithPhone(payload);

      logger.info('Login with phone successful', {
        context: req.context,
        authId: result.data.authId,
      });

      setAuthCookie(res, result.token);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          ...result.data,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendVerification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const payload = req.body as SendVerificationRequest;
      const result = await this.authService.sendVerification(payload);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { success: true, alreadyVerified: result.alreadyVerified ?? false },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

  async refresh(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload = req.body as RefreshRequest;
      const result = await this.authService.refresh(payload);

      logger.info('Refresh token successful', {
        context: req.context,
        authId: result.data.authId,
      });

      setAuthCookie(res, result.token);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          ...result.data,
          token: result.token,
          refreshToken: result.refreshToken,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
