import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock';

jest.mock('../../src/config', () => ({
  prisma: mockedPrisma,
}));

import { AddressRepository } from '../../src/repositories/address.repository';
import { createMockAddress, createMockAddressWithUser, createMockCreateAddressPayload } from '../helpers/test-helpers';

describe('AddressRepository', () => {
  let repository: AddressRepository;

  beforeEach(() => {
    repository = new AddressRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an address', async () => {
      const userId = 'user-123';
      const data = createMockCreateAddressPayload();
      const mockAddress = createMockAddress({ userId });

      mockedPrisma.address.create.mockResolvedValue(mockAddress as never);

      const result = await repository.create(userId, data);

      expect(mockedPrisma.address.create).toHaveBeenCalledWith({
        data: {
          userId,
          label: data.label ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          postalCode: data.postalCode ?? null,
          country: data.country ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          isDefault: data.isDefault,
          isActive: true,
        },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('findById', () => {
    it('should find address by id', async () => {
      const addressId = 'addr-123';
      const mockAddress = createMockAddress();

      mockedPrisma.address.findUnique.mockResolvedValue(mockAddress as never);

      const result = await repository.findById(addressId);

      expect(mockedPrisma.address.findUnique).toHaveBeenCalledWith({
        where: { id: addressId },
      });
      expect(result).toEqual(mockAddress);
    });

    it('should return null if address not found', async () => {
      mockedPrisma.address.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithUser', () => {
    it('should find address with user', async () => {
      const addressId = 'addr-123';
      const mockAddressWithUser = createMockAddressWithUser();

      mockedPrisma.address.findUnique.mockResolvedValue(mockAddressWithUser as never);

      const result = await repository.findByIdWithUser(addressId);

      expect(mockedPrisma.address.findUnique).toHaveBeenCalledWith({
        where: { id: addressId },
        select: {
          id: true,
          userId: true,
          label: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          latitude: true,
          longitude: true,
          isDefault: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              authIdentityId: true,
              isActive: true,
              isDeleted: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAddressWithUser);
    });
  });

  describe('findByUserId', () => {
    it('should find addresses by user id', async () => {
      const userId = 'user-123';
      const addresses = [createMockAddress(), createMockAddress({ id: 'addr-456' })];

      mockedPrisma.address.findMany.mockResolvedValue(addresses as never);

      const result = await repository.findByUserId(userId);

      expect(mockedPrisma.address.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result).toEqual(addresses);
    });
  });

  describe('findDefaultByUserId', () => {
    it('should find default address by user id', async () => {
      const userId = 'user-123';
      const mockAddress = createMockAddress({ isDefault: true });

      mockedPrisma.address.findFirst.mockResolvedValue(mockAddress as never);

      const result = await repository.findDefaultByUserId(userId);

      expect(mockedPrisma.address.findFirst).toHaveBeenCalledWith({
        where: { userId, isDefault: true, isActive: true },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('update', () => {
    it('should update address', async () => {
      const addressId = 'addr-123';
      const payload = { label: 'Work', city: 'New City' };
      const mockAddress = createMockAddress(payload);

      mockedPrisma.address.update.mockResolvedValue(mockAddress as never);

      const result = await repository.update(addressId, payload);

      expect(mockedPrisma.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { ...payload, updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('unsetDefaultForUser', () => {
    it('should unset default for user', async () => {
      const userId = 'user-123';

      await repository.unsetDefaultForUser(userId);

      expect(mockedPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        data: { isDefault: false, updatedAt: expect.any(Date) },
      });
    });
  });

  describe('setAsDefault', () => {
    it('should set address as default in transaction', async () => {
      const addressId = 'addr-123';
      const userId = 'user-123';
      const mockAddress = createMockAddress({ isDefault: true });
      const mockTx = {
        address: {
          updateMany: jest.fn().mockResolvedValue(undefined),
          update: jest.fn().mockResolvedValue(mockAddress),
        },
      };

      mockedPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      const result = await repository.setAsDefault(addressId, userId);

      expect(mockedPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockTx.address.updateMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        data: { isDefault: false, updatedAt: expect.any(Date) },
      });
      expect(mockTx.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { isDefault: true, updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('softDelete', () => {
    it('should soft delete address', async () => {
      const addressId = 'addr-123';
      const mockAddress = createMockAddress({ isActive: false, isDefault: false });

      mockedPrisma.address.update.mockResolvedValue(mockAddress as never);

      const result = await repository.softDelete(addressId);

      expect(mockedPrisma.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { isActive: false, isDefault: false, updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockAddress);
    });
  });
});
