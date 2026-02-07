import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jest } from '@jest/globals';
import { ProviderController } from '../../src/controllers/provider.controller.js';
import type { ProviderService } from '../../src/service/index.js';

describe('ProviderController', () => {
  let controller: ProviderController;
  let mockService: jest.Mocked<ProviderService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      getProviderByAuthIdentityId: jest.fn(),
      getTopProvidersByLocation: jest.fn(),
      updateProviderProfile: jest.fn(),
      updateVerificationStatus: jest.fn(),
      createProvider: jest.fn(),
    } as unknown as jest.Mocked<ProviderService>;
    controller = new ProviderController(mockService);
    mockRequest = { params: {}, query: {}, body: {}, headers: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProviderProfile', () => {
    it('returns 200 and data when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const provider = { id: 'p1', authIdentityId: 'auth-123', firstName: 'John', lastName: 'Doe' };
      mockService.getProviderByAuthIdentityId.mockResolvedValue(provider as never);
      await controller.getProviderProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.getProviderByAuthIdentityId).toHaveBeenCalledWith('auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: provider,
        error: null,
      });
    });

    it('calls next with error when service throws', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const err = new Error('Not found');
      mockService.getProviderByAuthIdentityId.mockRejectedValue(err);
      await controller.getProviderProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });

  describe('getTopProvidersByLocation', () => {
    it('returns 200 and data when service succeeds', async () => {
      mockRequest.query = { city: 'NYC' };
      mockService.getTopProvidersByLocation.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 } as never);
      await controller.getTopProvidersByLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.getTopProvidersByLocation).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('updateProviderProfile', () => {
    it('returns 200 when service succeeds', async () => {
      mockRequest.params = { id: 'p1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { firstName: 'Jane' };
      mockService.updateProviderProfile.mockResolvedValue({ id: 'p1', firstName: 'Jane' } as never);
      await controller.updateProviderProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.updateProviderProfile).toHaveBeenCalledWith('p1', { firstName: 'Jane' }, 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('calls next with error when service throws', async () => {
      mockRequest.params = { id: 'p1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { firstName: 'Jane' };
      mockService.updateProviderProfile.mockRejectedValue(new Error('Forbidden'));
      await controller.updateProviderProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateVerificationStatus', () => {
    it('returns 200 when service succeeds', async () => {
      mockRequest.params = { providerId: 'p1' };
      mockRequest.body = { verificationStatus: 'VERIFIED' };
      mockService.updateVerificationStatus.mockResolvedValue({ id: 'p1', verificationStatus: 'VERIFIED' } as never);
      await controller.updateVerificationStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.updateVerificationStatus).toHaveBeenCalledWith('p1', 'VERIFIED');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });
});
