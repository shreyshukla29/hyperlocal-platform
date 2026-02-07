import { ProviderRepository } from '../repositories/provider.repository.js';
import { ProviderOfferingRepository } from '../repositories/provider-offering.repository.js';
import type {
  CreateProviderOfferingPayload,
  UpdateProviderOfferingRepositoryPayload,
  ListProviderOfferingsQuery,
  PaginatedResult,
  ProviderOfferingResponse,
} from '../types/provider-offering.types.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import { ProviderServiceStatus } from '../enums/index.js';

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

  /**
   * Booking quote: validate providerId + providerServiceId and return price (from backend only).
   * Used by Booking service so amount always comes from backend; no client tampering.
   */
  async getBookingQuote(
    providerId: string,
    providerServiceId: string,
  ): Promise<{ pricePaise: number; durationMinutes: number | null; providerAuthId: string }> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (!provider.isActive || provider.isDeleted) {
      throw new BadRequestError('Provider is inactive or deleted');
    }
    const offering = await this.offeringRepo.findByIdAndProviderId(
      providerServiceId,
      providerId,
    );
    if (!offering) {
      throw new NotFoundError('Service offering not found');
    }
    if (offering.status !== ProviderServiceStatus.ACTIVE) {
      throw new BadRequestError('Service offering is not active');
    }
    const priceRupees = typeof offering.price === 'object' && offering.price !== null && 'toString' in offering.price
      ? parseFloat((offering.price as { toString(): string }).toString())
      : parseFloat(String(offering.price));
    const pricePaise = Math.round(priceRupees * 100);
    if (pricePaise < 100) {
      throw new BadRequestError('Service price must be at least INR 1');
    }
    return {
      pricePaise,
      durationMinutes: offering.durationMinutes ?? null,
      providerAuthId: provider.authIdentityId,
    };
  }
}
