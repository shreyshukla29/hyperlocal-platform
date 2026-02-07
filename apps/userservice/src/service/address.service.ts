import { AddressRepository, UserRepository } from '../repositories/index.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import type { CreateAddressData, UpdateAddressRepositoryPayload } from '../types/index.js';
import type {
  CreateAddressPayload as CreateAddressValidatorPayload,
  UpdateAddressPayload,
  SaveCurrentLocationPayload,
} from '../validators/index.js';

export class AddressService {
  constructor(
    private readonly addressRepo: AddressRepository,
    private readonly userRepo: UserRepository,
  ) {}

  private async ensureUserCanAccessAddress(userId: string, addressId: string, authIdentityId: string) {
    const row = await this.addressRepo.findByIdWithUser(addressId);
    if (!row) throw new NotFoundError('Address not found');
    if (row.userId !== userId) throw new ForbiddenError('Address does not belong to user');
    if (row.user.authIdentityId !== authIdentityId) throw new ForbiddenError('Access denied');
    if (!row.user.isActive || row.user.isDeleted) throw new ForbiddenError('User account is inactive or deleted');
    if (!row.isActive) throw new NotFoundError('Address not found or has been deleted');
    return row;
  }

  private async ensureUserOwnsAddress(userId: string, addressId: string, authIdentityId: string) {
    const row = await this.addressRepo.findByIdWithUser(addressId);
    if (!row) throw new NotFoundError('Address not found');
    if (row.userId !== userId) throw new ForbiddenError('Address does not belong to user');
    if (row.user.authIdentityId !== authIdentityId) throw new ForbiddenError('Access denied');
    if (!row.user.isActive || row.user.isDeleted) throw new ForbiddenError('User account is inactive or deleted');
    return row;
  }

  private async ensureUserOwnsResource(userId: string, authIdentityId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.authIdentityId !== authIdentityId) throw new ForbiddenError('Access denied');
    if (!user.isActive || user.isDeleted) throw new ForbiddenError('User account is inactive or deleted');
  }

  async listAddresses(userId: string, authIdentityId?: string) {
    if (!userId) throw new BadRequestError('User ID is required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserOwnsResource(userId, authIdentityId);
    return this.addressRepo.findByUserId(userId);
  }

  async createAddress(
    userId: string,
    payload: CreateAddressValidatorPayload,
    authIdentityId?: string,
  ) {
    if (!userId) throw new BadRequestError('User ID is required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserOwnsResource(userId, authIdentityId);

    const isDefault = payload.isDefault ?? false;
    if (isDefault) await this.addressRepo.unsetDefaultForUser(userId);

    const data: CreateAddressData = {
      label: payload.label ?? null,
      addressLine1: payload.addressLine1 ?? null,
      addressLine2: payload.addressLine2 ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      postalCode: payload.postalCode ?? null,
      country: payload.country ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      isDefault,
    };
    return this.addressRepo.create(userId, data);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    payload: UpdateAddressPayload,
    authIdentityId?: string,
  ) {
    if (!userId || !addressId) throw new BadRequestError('User ID and Address ID are required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserCanAccessAddress(userId, addressId, authIdentityId);

    const updateData: UpdateAddressRepositoryPayload = {};
    if (payload.label !== undefined) updateData.label = payload.label;
    if (payload.addressLine1 !== undefined) updateData.addressLine1 = payload.addressLine1;
    if (payload.addressLine2 !== undefined) updateData.addressLine2 = payload.addressLine2;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.state !== undefined) updateData.state = payload.state;
    if (payload.postalCode !== undefined) updateData.postalCode = payload.postalCode;
    if (payload.country !== undefined) updateData.country = payload.country;
    if (payload.latitude !== undefined) updateData.latitude = payload.latitude;
    if (payload.longitude !== undefined) updateData.longitude = payload.longitude;
    if (payload.isDefault !== undefined) {
      if (payload.isDefault) await this.addressRepo.unsetDefaultForUser(userId);
      updateData.isDefault = payload.isDefault;
    }

    if (Object.keys(updateData).length === 0) throw new BadRequestError('No fields to update');
    return this.addressRepo.update(addressId, updateData);
  }

  async setDefaultAddress(userId: string, addressId: string, authIdentityId?: string) {
    if (!userId || !addressId) throw new BadRequestError('User ID and Address ID are required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserCanAccessAddress(userId, addressId, authIdentityId);
    return this.addressRepo.setAsDefault(addressId, userId);
  }

  async getDefaultAddress(userId: string, authIdentityId?: string) {
    if (!userId) throw new BadRequestError('User ID is required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserOwnsResource(userId, authIdentityId);
    const address = await this.addressRepo.findDefaultByUserId(userId);
    if (!address) throw new NotFoundError('No default address set');
    return address;
  }

  async saveCurrentLocation(
    userId: string,
    payload: SaveCurrentLocationPayload,
    authIdentityId?: string,
  ) {
    if (!userId) throw new BadRequestError('User ID is required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserOwnsResource(userId, authIdentityId);

    const isDefault = payload.setAsDefault ?? true;
    if (isDefault) await this.addressRepo.unsetDefaultForUser(userId);

    const data: CreateAddressData = {
      label: payload.label ?? 'Current Location',
      addressLine1: payload.addressLine1 ?? null,
      addressLine2: payload.addressLine2 ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      postalCode: payload.postalCode ?? null,
      country: payload.country ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      isDefault,
    };
    return this.addressRepo.create(userId, data);
  }

  async getCurrentLocation(userId: string, authIdentityId?: string) {
    return this.getDefaultAddress(userId, authIdentityId);
  }

  async deleteAddress(userId: string, addressId: string, authIdentityId?: string) {
    if (!userId || !addressId) throw new BadRequestError('User ID and Address ID are required');
    if (!authIdentityId) throw new BadRequestError('Auth identity ID is required');
    await this.ensureUserOwnsAddress(userId, addressId, authIdentityId);
    return this.addressRepo.softDelete(addressId);
  }
}
