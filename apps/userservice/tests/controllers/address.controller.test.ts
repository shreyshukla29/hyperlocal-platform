import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AddressController } from '../../src/controllers/address.controller';
import { AddressService } from '../../src/service/address.service';
import { createMockAddress } from '../helpers/test-helpers';
import { jest } from '@jest/globals';
import { NotFoundError, BadRequestError, ForbiddenError } from '@hyperlocal/shared/errors';

jest.mock('../../src/service/address.service');

describe('AddressController', () => {
  let controller: AddressController;
  let mockService: jest.Mocked<AddressService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      listAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      setDefaultAddress: jest.fn(),
      getDefaultAddress: jest.fn(),
      saveCurrentLocation: jest.fn(),
      getCurrentLocation: jest.fn(),
      deleteAddress: jest.fn(),
    } as unknown as jest.Mocked<AddressService>;

    controller = new AddressController(mockService);

    mockRequest = {
      headers: {},
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('listAddresses', () => {
    it('should return addresses successfully', async () => {
      const addresses = [createMockAddress()];
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.listAddresses.mockResolvedValue(addresses as never);

      await controller.listAddresses(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.listAddresses).toHaveBeenCalledWith('user-123', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: addresses,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const error = new NotFoundError('User not found');
      mockService.listAddresses.mockRejectedValue(error);

      await controller.listAddresses(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      const mockAddress = createMockAddress();
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { label: 'Home', addressLine1: '123 Main St' };
      mockService.createAddress.mockResolvedValue(mockAddress as never);

      await controller.createAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.createAddress).toHaveBeenCalledWith(
        'user-123',
        { label: 'Home', addressLine1: '123 Main St' },
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = {};
      const error = new BadRequestError('User ID is required');
      mockService.createAddress.mockRejectedValue(error);

      await controller.createAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      const mockAddress = createMockAddress({ label: 'Work' });
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { label: 'Work' };
      mockService.updateAddress.mockResolvedValue(mockAddress as never);

      await controller.updateAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.updateAddress).toHaveBeenCalledWith(
        'user-123',
        'addr-123',
        { label: 'Work' },
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { label: 'Work' };
      const error = new ForbiddenError('Access denied');
      mockService.updateAddress.mockRejectedValue(error);

      await controller.updateAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('setDefaultAddress', () => {
    it('should set default address successfully', async () => {
      const mockAddress = createMockAddress({ isDefault: true });
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.setDefaultAddress.mockResolvedValue(mockAddress as never);

      await controller.setDefaultAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.setDefaultAddress).toHaveBeenCalledWith(
        'user-123',
        'addr-123',
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const error = new NotFoundError('Address not found');
      mockService.setDefaultAddress.mockRejectedValue(error);

      await controller.setDefaultAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getDefaultAddress', () => {
    it('should return default address successfully', async () => {
      const mockAddress = createMockAddress({ isDefault: true });
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.getDefaultAddress.mockResolvedValue(mockAddress as never);

      await controller.getDefaultAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.getDefaultAddress).toHaveBeenCalledWith('user-123', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const error = new NotFoundError('No default address set');
      mockService.getDefaultAddress.mockRejectedValue(error);

      await controller.getDefaultAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('saveCurrentLocation', () => {
    it('should save current location successfully', async () => {
      const mockAddress = createMockAddress({ label: 'Current Location' });
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { latitude: 12.34, longitude: 56.78 };
      mockService.saveCurrentLocation.mockResolvedValue(mockAddress as never);

      await controller.saveCurrentLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.saveCurrentLocation).toHaveBeenCalledWith(
        'user-123',
        { latitude: 12.34, longitude: 56.78 },
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = { latitude: 12.34, longitude: 56.78 };
      const error = new BadRequestError('Auth identity ID is required');
      mockService.saveCurrentLocation.mockRejectedValue(error);

      await controller.saveCurrentLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return current location successfully', async () => {
      const mockAddress = createMockAddress();
      mockRequest.params = { userId: 'user-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.getCurrentLocation.mockResolvedValue(mockAddress as never);

      await controller.getCurrentLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.getCurrentLocation).toHaveBeenCalledWith('user-123', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAddress,
        error: null,
      });
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.deleteAddress.mockResolvedValue(createMockAddress() as never);

      await controller.deleteAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.deleteAddress).toHaveBeenCalledWith(
        'user-123',
        'addr-123',
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Address deleted' },
        error: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.params = { userId: 'user-123', addressId: 'addr-123' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const error = new ForbiddenError('Access denied');
      mockService.deleteAddress.mockRejectedValue(error);

      await controller.deleteAddress(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
