import { AddressRepository } from '../../src/repositories/address.repository';
import { UserRepository } from '../../src/repositories/user.repository';
import { AddressService } from '../../src/service/address.service';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import {
  createMockUser,
  createMockAddress,
  createMockAddressWithUser,
} from '../helpers/test-helpers';
import { jest } from '@jest/globals';

describe('AddressService', () => {
  let service: AddressService;
  let mockAddressRepo: jest.Mocked<AddressRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockAddressRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithUser: jest.fn(),
      findByUserId: jest.fn(),
      findDefaultByUserId: jest.fn(),
      update: jest.fn(),
      unsetDefaultForUser: jest.fn(),
      setAsDefault: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<AddressRepository>;

    mockUserRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    service = new AddressService(mockAddressRepo, mockUserRepo);
    jest.clearAllMocks();
  });

  describe('listAddresses', () => {
    it('should return addresses when user owns resource', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const mockUser = createMockUser();
      const addresses = [createMockAddress()];

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.findByUserId.mockResolvedValue(addresses as never);

      const result = await service.listAddresses(userId, authIdentityId);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(addresses);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.listAddresses('', 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.listAddresses('', 'auth-123')).rejects.toThrow('User ID is required');
    });

    it('should throw BadRequestError when authIdentityId is empty', async () => {
      await expect(service.listAddresses('user-123', '')).rejects.toThrow(BadRequestError);
      await expect(service.listAddresses('user-123', '')).rejects.toThrow('Auth identity ID is required');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.listAddresses('user-123', 'auth-123')).rejects.toThrow(NotFoundError);
      await expect(service.listAddresses('user-123', 'auth-123')).rejects.toThrow('User not found');
    });

    it('should throw ForbiddenError when authIdentityId does not match', async () => {
      const mockUser = createMockUser({ authIdentityId: 'other-auth' });
      mockUserRepo.findById.mockResolvedValue(mockUser as never);

      await expect(service.listAddresses('user-123', 'auth-123')).rejects.toThrow(ForbiddenError);
      await expect(service.listAddresses('user-123', 'auth-123')).rejects.toThrow('Access denied');
    });
  });

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const payload = { label: 'Home', addressLine1: '123 Main St' };
      const mockUser = createMockUser();
      const mockAddress = createMockAddress();

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.create.mockResolvedValue(mockAddress as never);

      const result = await service.createAddress(userId, payload, authIdentityId);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.create).toHaveBeenCalledWith(userId, expect.objectContaining({
        label: 'Home',
        addressLine1: '123 Main St',
        isDefault: false,
      }));
      expect(result).toEqual(mockAddress);
    });

    it('should unset default then create when isDefault is true', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const payload = { label: 'Home', isDefault: true };
      const mockUser = createMockUser();
      const mockAddress = createMockAddress({ isDefault: true });

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.unsetDefaultForUser.mockResolvedValue(undefined as never);
      mockAddressRepo.create.mockResolvedValue(mockAddress as never);

      await service.createAddress(userId, payload, authIdentityId);

      expect(mockAddressRepo.unsetDefaultForUser).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.create).toHaveBeenCalledWith(userId, expect.objectContaining({ isDefault: true }));
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.createAddress('', {}, 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when authIdentityId is empty', async () => {
      await expect(service.createAddress('user-123', {}, '')).rejects.toThrow(BadRequestError);
    });

    it('should throw ForbiddenError when user does not own resource', async () => {
      const mockUser = createMockUser({ authIdentityId: 'other-auth' });
      mockUserRepo.findById.mockResolvedValue(mockUser as never);

      await expect(service.createAddress('user-123', { label: 'Home' }, 'auth-123')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      const userId = 'user-123';
      const addressId = 'addr-123';
      const authIdentityId = 'auth-123';
      const payload = { label: 'Work' };
      const mockAddressWithUser = createMockAddressWithUser();
      const updatedAddress = createMockAddress({ label: 'Work' });

      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);
      mockAddressRepo.update.mockResolvedValue(updatedAddress as never);

      const result = await service.updateAddress(userId, addressId, payload, authIdentityId);

      expect(mockAddressRepo.findByIdWithUser).toHaveBeenCalledWith(addressId);
      expect(mockAddressRepo.update).toHaveBeenCalledWith(addressId, expect.objectContaining({ label: 'Work' }));
      expect(result).toEqual(updatedAddress);
    });

    it('should throw BadRequestError when userId or addressId is empty', async () => {
      await expect(service.updateAddress('', 'addr-123', { label: 'Work' }, 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.updateAddress('user-123', '', { label: 'Work' }, 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when authIdentityId is empty', async () => {
      await expect(service.updateAddress('user-123', 'addr-123', { label: 'Work' }, '')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepo.findByIdWithUser.mockResolvedValue(null);

      await expect(service.updateAddress('user-123', 'addr-123', { label: 'Work' }, 'auth-123')).rejects.toThrow(NotFoundError);
      await expect(service.updateAddress('user-123', 'addr-123', { label: 'Work' }, 'auth-123')).rejects.toThrow('Address not found');
    });

    it('should throw ForbiddenError when address does not belong to user', async () => {
      const mockAddressWithUser = createMockAddressWithUser({ userId: 'other-user' });
      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);

      await expect(service.updateAddress('user-123', 'addr-123', { label: 'Work' }, 'auth-123')).rejects.toThrow(ForbiddenError);
      await expect(service.updateAddress('user-123', 'addr-123', { label: 'Work' }, 'auth-123')).rejects.toThrow('Address does not belong to user');
    });

    it('should throw BadRequestError when no fields to update', async () => {
      const mockAddressWithUser = createMockAddressWithUser();
      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);

      await expect(service.updateAddress('user-123', 'addr-123', {}, 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.updateAddress('user-123', 'addr-123', {}, 'auth-123')).rejects.toThrow('No fields to update');
    });
  });

  describe('setDefaultAddress', () => {
    it('should set default address successfully', async () => {
      const userId = 'user-123';
      const addressId = 'addr-123';
      const authIdentityId = 'auth-123';
      const mockAddressWithUser = createMockAddressWithUser();
      const updatedAddress = createMockAddress({ isDefault: true });

      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);
      mockAddressRepo.setAsDefault.mockResolvedValue(updatedAddress as never);

      const result = await service.setDefaultAddress(userId, addressId, authIdentityId);

      expect(mockAddressRepo.findByIdWithUser).toHaveBeenCalledWith(addressId);
      expect(mockAddressRepo.setAsDefault).toHaveBeenCalledWith(addressId, userId);
      expect(result).toEqual(updatedAddress);
    });

    it('should throw BadRequestError when userId or addressId is empty', async () => {
      await expect(service.setDefaultAddress('', 'addr-123', 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.setDefaultAddress('user-123', '', 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepo.findByIdWithUser.mockResolvedValue(null);

      await expect(service.setDefaultAddress('user-123', 'addr-123', 'auth-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDefaultAddress', () => {
    it('should return default address when found', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const mockUser = createMockUser();
      const mockAddress = createMockAddress({ isDefault: true });

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.findDefaultByUserId.mockResolvedValue(mockAddress as never);

      const result = await service.getDefaultAddress(userId, authIdentityId);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockAddress);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.getDefaultAddress('', 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when no default address set', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.findDefaultByUserId.mockResolvedValue(null);

      await expect(service.getDefaultAddress('user-123', 'auth-123')).rejects.toThrow(NotFoundError);
      await expect(service.getDefaultAddress('user-123', 'auth-123')).rejects.toThrow('No default address set');
    });
  });

  describe('saveCurrentLocation', () => {
    it('should save current location successfully', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const payload = { latitude: 12.34, longitude: 56.78 };
      const mockUser = createMockUser();
      const mockAddress = createMockAddress({ label: 'Current Location' });

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.unsetDefaultForUser.mockResolvedValue(undefined as never);
      mockAddressRepo.create.mockResolvedValue(mockAddress as never);

      const result = await service.saveCurrentLocation(userId, payload, authIdentityId);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.unsetDefaultForUser).toHaveBeenCalledWith(userId);
      expect(mockAddressRepo.create).toHaveBeenCalledWith(userId, expect.objectContaining({
        latitude: 12.34,
        longitude: 56.78,
        label: 'Current Location',
        isDefault: true,
      }));
      expect(result).toEqual(mockAddress);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.saveCurrentLocation('', { latitude: 12, longitude: 56 }, 'auth-123')).rejects.toThrow(BadRequestError);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return default address as current location', async () => {
      const userId = 'user-123';
      const authIdentityId = 'auth-123';
      const mockUser = createMockUser();
      const mockAddress = createMockAddress({ isDefault: true });

      mockUserRepo.findById.mockResolvedValue(mockUser as never);
      mockAddressRepo.findDefaultByUserId.mockResolvedValue(mockAddress as never);

      const result = await service.getCurrentLocation(userId, authIdentityId);

      expect(mockAddressRepo.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockAddress);
    });
  });

  describe('deleteAddress', () => {
    it('should soft delete address successfully', async () => {
      const userId = 'user-123';
      const addressId = 'addr-123';
      const authIdentityId = 'auth-123';
      const mockAddressWithUser = createMockAddressWithUser();
      const softDeletedAddress = createMockAddress({ isActive: false });

      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);
      mockAddressRepo.softDelete.mockResolvedValue(softDeletedAddress as never);

      const result = await service.deleteAddress(userId, addressId, authIdentityId);

      expect(mockAddressRepo.findByIdWithUser).toHaveBeenCalledWith(addressId);
      expect(mockAddressRepo.softDelete).toHaveBeenCalledWith(addressId);
      expect(result).toEqual(softDeletedAddress);
    });

    it('should throw BadRequestError when userId or addressId is empty', async () => {
      await expect(service.deleteAddress('', 'addr-123', 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.deleteAddress('user-123', '', 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepo.findByIdWithUser.mockResolvedValue(null);

      await expect(service.deleteAddress('user-123', 'addr-123', 'auth-123')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when address does not belong to user', async () => {
      const mockAddressWithUser = createMockAddressWithUser({ userId: 'other-user' });
      mockAddressRepo.findByIdWithUser.mockResolvedValue(mockAddressWithUser as never);

      await expect(service.deleteAddress('user-123', 'addr-123', 'auth-123')).rejects.toThrow(ForbiddenError);
    });
  });
});
