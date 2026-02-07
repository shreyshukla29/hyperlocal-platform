import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jest } from '@jest/globals';
import { AuthController } from '../../src/controllers/auth.controller.js';
import type { AuthService } from '../../src/services/index.js';

jest.mock('@hyperlocal/shared/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn() },
}));
jest.mock('../../src/config/index.js', () => ({
  ServerConfig: { NODE_ENV: 'test' },
}));

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      signup: jest.fn(),
      loginWithEmail: jest.fn(),
      loginWithPhone: jest.fn(),
      sendVerification: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    controller = new AuthController(mockService);
    mockRequest = { body: {}, context: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('returns 201 and data when service succeeds', async () => {
      const data = { userId: 'u1', email: 'a@b.com' };
      mockService.signup.mockResolvedValue({ userId: 'u1', token: 't', data });
      mockRequest.body = {
        email: 'a@b.com',
        password: 'password123',
        accountType: 'USER',
        firstName: 'John',
        lastName: 'Doe',
      };

      await controller.signup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.signup).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        error: null,
      });
    });

    it('calls next with error when service throws', async () => {
      const err = new Error('Conflict');
      mockService.signup.mockRejectedValue(err);
      mockRequest.body = { email: 'a@b.com', password: 'pwd', accountType: 'USER', firstName: 'J', lastName: 'D' };

      await controller.signup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });

  describe('loginWithEmail', () => {
    it('returns 200 and data when service succeeds', async () => {
      const data = { authId: 'u1', accountType: 'USER' };
      mockService.loginWithEmail.mockResolvedValue({ userId: 'u1', token: 't', data } as never);
      mockRequest.body = { method: 'EMAIL', email: 'a@b.com', password: 'pwd', loginAs: 'USER' };

      await controller.loginWithEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.loginWithEmail).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('loginWithPhone', () => {
    it('returns 200 and data when service succeeds', async () => {
      const data = { authId: 'u1', accountType: 'USER' };
      mockService.loginWithPhone.mockResolvedValue({ userId: 'u1', token: 't', data } as never);
      mockRequest.body = { method: 'PHONE', phone: '9876543210', password: 'pwd', loginAs: 'USER' };

      await controller.loginWithPhone(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.loginWithPhone).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('calls next with error when service throws', async () => {
      mockService.loginWithPhone.mockRejectedValue(new Error('Invalid'));
      mockRequest.body = { method: 'PHONE', phone: '9876543210', password: 'pwd', loginAs: 'USER' };
      await controller.loginWithPhone(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('sendVerification', () => {
    it('returns 401 when identityId missing', async () => {
      mockRequest.headers = {};
      mockRequest.body = { type: 'EMAIL', value: 'a@b.com' };
      await controller.sendVerification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    it('returns 200 when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { type: 'EMAIL', value: 'a@b.com' };
      mockService.sendVerification.mockResolvedValue({ success: true });
      await controller.sendVerification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.sendVerification).toHaveBeenCalledWith('auth-123', { type: 'EMAIL', value: 'a@b.com' });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('verify', () => {
    it('returns 200 when service succeeds', async () => {
      mockRequest.body = { type: 'EMAIL', value: 'a@b.com', code: '123456' };
      mockService.verify.mockResolvedValue({ success: true });
      await controller.verify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.verify).toHaveBeenCalledWith({ type: 'EMAIL', value: 'a@b.com', code: '123456' });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('calls next with error when service throws', async () => {
      mockRequest.body = { type: 'EMAIL', value: 'a@b.com', code: 'wrong' };
      mockService.verify.mockRejectedValue(new Error('Invalid OTP'));
      await controller.verify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
