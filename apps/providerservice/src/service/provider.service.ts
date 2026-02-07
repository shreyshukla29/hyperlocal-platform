import { ProviderRepository } from '../repositories/index.js';
import {
  CreateProviderPayload,
  UpdateProviderRepositoryPayload,
  TopProvidersByLocationQuery,
  PaginatedProvidersResult,
} from '../types/index.js';
import { UpdateProviderProfilePayload } from '../validators/index.js';
import { logger } from '@hyperlocal/shared/logger';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import { VerificationStatus } from '../enums/index.js';

export class ProviderService {
  constructor(private readonly providerRepo: ProviderRepository) {}

  async createProvider(payload: CreateProviderPayload) {
    const provider = await this.providerRepo.createProvider(payload);

    logger.info('Provider created (idempotent)', {
      providerId: provider.id,
      authIdentityId: payload.authIdentityId,
    });

    return provider;
  }

  async getProviderByAuthIdentityId(authIdentityId?: string) {
    if (!authIdentityId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    return provider;
  }

  async updateProviderProfile(
    providerId: string,
    payload: UpdateProviderProfilePayload,
    requestingAuthId?: string,
  ) {
    if (!providerId) {
      throw new BadRequestError('Provider ID is required');
    }

    if (!requestingAuthId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    if (!Object.keys(payload).length) {
      throw new BadRequestError('No fields provided to update');
    }

    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    if (provider.authIdentityId !== requestingAuthId) {
      throw new ForbiddenError(
        'Access denied: Cannot update another provider profile',
      );
    }

    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    const updateData: UpdateProviderRepositoryPayload = {};
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.businessName !== undefined)
      updateData.businessName = payload.businessName;
    if (payload.businessAddress !== undefined)
      updateData.businessAddress = payload.businessAddress;
    if (payload.latitude !== undefined) updateData.latitude = payload.latitude;
    if (payload.longitude !== undefined) updateData.longitude = payload.longitude;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.availabilityStatus !== undefined)
      updateData.availabilityStatus = payload.availabilityStatus;

    const updatedProvider = await this.providerRepo.updateProfile(
      providerId,
      updateData,
    );

    logger.info('Provider profile updated', {
      providerId,
      updatedFields: Object.keys(updateData),
    });

    return updatedProvider;
  }

  async getTopProvidersByLocation(
    query: TopProvidersByLocationQuery,
  ): Promise<PaginatedProvidersResult> {
    return this.providerRepo.findTopByLocation(query);
  }

  /** Admin-only: set provider verification status (VERIFIED | PENDING | REJECTED). */
  async updateVerificationStatus(
    providerId: string,
    verificationStatus: VerificationStatus,
  ) {
    if (!providerId) {
      throw new BadRequestError('Provider ID is required');
    }

    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    const updated = await this.providerRepo.updateVerificationStatus(
      providerId,
      verificationStatus,
    );

    logger.info('Provider verification status updated', {
      providerId,
      verificationStatus,
    });

    return updated;
  }
}
