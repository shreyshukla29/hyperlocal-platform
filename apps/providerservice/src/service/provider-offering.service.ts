import { ProviderRepository } from '../repositories/provider.repository';
import { ProviderOfferingRepository } from '../repositories/provider-offering.repository';
import type {
  CreateProviderOfferingPayload,
  UpdateProviderOfferingRepositoryPayload,
  ListProviderOfferingsQuery,
  PaginatedResult,
  ProviderOfferingResponse,
} from '../types/provider-offering.types';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';

export class ProviderOfferingService {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly offeringRepo: ProviderOfferingRepository,
  ) {}

  async create(
    authIdentityId: string,
    payload: CreateProviderOfferingPayload,
  ): Promise<ProviderOfferingResponse> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    return this.offeringRepo.create({
      providerId: provider.id,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      price: payload.price,
      durationMinutes: payload.durationMinutes,
      status: payload.status,
    });
  }

  async list(
    authIdentityId: string,
    query?: ListProviderOfferingsQuery,
  ): Promise<PaginatedResult<ProviderOfferingResponse>> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    return this.offeringRepo.findByProviderId(provider.id, query);
  }

  async getById(
    authIdentityId: string,
    offeringId: string,
  ): Promise<ProviderOfferingResponse> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    const record = await this.offeringRepo.findByIdAndProviderId(
      offeringId,
      provider.id,
    );
    if (!record) {
      throw new NotFoundError('Service offering not found');
    }

    return {
      id: record.id,
      providerId: record.providerId,
      name: record.name,
      description: record.description,
      category: record.category,
      price: typeof record.price === 'object' && record.price !== null && 'toString' in record.price ? record.price.toString() : String(record.price),
      durationMinutes: record.durationMinutes,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async update(
    authIdentityId: string,
    offeringId: string,
    payload: UpdateProviderOfferingRepositoryPayload,
  ): Promise<ProviderOfferingResponse> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }

    const existing = await this.offeringRepo.findByIdAndProviderId(
      offeringId,
      provider.id,
    );
    if (!existing) {
      throw new NotFoundError('Service offering not found');
    }
    return this.offeringRepo.update(offeringId, payload);
  }

  async delete(authIdentityId: string, offeringId: string): Promise<void> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new ForbiddenError('Provider account is inactive or deleted');
    }
    const existing = await this.offeringRepo.findByIdAndProviderId(
      offeringId,
      provider.id,
    );
    if (!existing) {
      throw new NotFoundError('Service offering not found');
    }
    await this.offeringRepo.delete(offeringId);
  }
}
