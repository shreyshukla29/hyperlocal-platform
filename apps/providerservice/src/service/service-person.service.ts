import { ProviderRepository } from '../repositories/provider.repository';
import { ServicePersonRepository } from '../repositories/service-person.repository';
import {
  CreateServicePersonPayload,
  UpdateServicePersonRepositoryPayload,
  UpdateServicePersonStatusPayload,
  ListServicePeopleQuery,
} from '../types';
import type {
  CreateServicePersonPayload as CreateSchemaPayload,
  UpdateServicePersonPayload as UpdateSchemaPayload,
  ListServicePeopleQueryPayload,
} from '../validators/service-person.schema';
import { VerificationStatus } from '../enums';
import { logger } from '@hyperlocal/shared/logger';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';

export class ServicePersonService {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly servicePersonRepo: ServicePersonRepository,
  ) {}

  /**
   * Only the provider (owner) can create service people.
   * Caller must be the provider identified by JWT (x-user-id); no other role (user, service person, etc.) can create.
   * providerId is never taken from the request body – it is always the resolved provider's id.
   */
  async create(
    authIdentityId: string,
    payload: CreateSchemaPayload,
  ): Promise<{ id: string; name: string; phone: string; status: string }> {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new ForbiddenError(
        'Only providers can create service people. This account is not a provider.',
      );
    }
    if (provider.authIdentityId !== authIdentityId) {
      throw new ForbiddenError('Access denied');
    }
    if (provider.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenError(
        'Provider must be verified to add service people. Complete verification first.',
      );
    }

    const providerServiceIds = payload.providerServiceIds ?? [];
    const valid =
      await this.servicePersonRepo.validateProviderServiceIdsBelongToProvider(
        provider.id,
        providerServiceIds,
      );
    if (!valid) {
      throw new BadRequestError(
        'One or more service type IDs do not belong to this provider',
      );
    }

    const createPayload: CreateServicePersonPayload = {
      providerId: provider.id,
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      role: payload.role ?? null,
      providerServiceIds,
    };

    const servicePerson = await this.servicePersonRepo.create(createPayload);

    logger.info('Service person created', {
      servicePersonId: servicePerson.id,
      providerId: provider.id,
    });

    return {
      id: servicePerson.id,
      name: servicePerson.name,
      phone: servicePerson.phone,
      status: servicePerson.status,
    };
  }

  async list(
    authIdentityId: string,
    query?: ListServicePeopleQueryPayload,
  ): Promise<
    {
      id: string;
      providerId: string;
      provider: { id: string; businessName: string | null; firstName: string; lastName: string };
      name: string;
      phone: string;
      status: string;
      isActive: boolean;
      providerServices: { id: string; name: string; category: string | null }[];
    }[]
  > {
    const provider = await this.providerRepo.findByAuthIdentityId(authIdentityId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (provider.authIdentityId !== authIdentityId) {
      throw new ForbiddenError('Access denied');
    }

    const listQuery: ListServicePeopleQuery = {};
    if (query?.status !== undefined) listQuery.status = query.status;
    if (query?.isActive !== undefined) listQuery.isActive = query.isActive;
    if (query?.providerServiceId !== undefined)
      listQuery.providerServiceId = query.providerServiceId;

    const list = await this.servicePersonRepo.findByProviderId(provider.id, listQuery);
    return list.map((sp) => ({
      id: sp.id,
      providerId: sp.providerId,
      provider: sp.provider,
      name: sp.name,
      phone: sp.phone,
      status: sp.status,
      isActive: sp.isActive,
      providerServices: sp.servicePersonProviderServices.map(
        (s) => s.providerService,
      ),
    }));
  }

  async getById(
    servicePersonId: string,
    authIdentityId: string,
  ): Promise<{
    id: string;
    providerId: string;
    provider: { id: string; businessName: string | null; firstName: string; lastName: string };
    name: string;
    phone: string;
    email: string | null;
    role: string | null;
    status: string;
    isActive: boolean;
    providerServices: { id: string; name: string; category: string | null }[];
  }> {
    const servicePerson =
      await this.servicePersonRepo.findByIdWithProviderAndServices(
        servicePersonId,
      );
    if (!servicePerson) {
      throw new NotFoundError('Service person not found');
    }

    const provider = await this.providerRepo.findById(servicePerson.providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    const isProvider = provider.authIdentityId === authIdentityId;
    const isWorker = servicePerson.authIdentityId === authIdentityId;
    if (!isProvider && !isWorker) {
      throw new ForbiddenError('Access denied');
    }

    return {
      id: servicePerson.id,
      providerId: servicePerson.providerId,
      provider: servicePerson.provider,
      name: servicePerson.name,
      phone: servicePerson.phone,
      email: servicePerson.email,
      role: servicePerson.role,
      status: servicePerson.status,
      isActive: servicePerson.isActive,
      providerServices: servicePerson.servicePersonProviderServices.map(
        (s) => s.providerService,
      ),
    };
  }

  async update(
    servicePersonId: string,
    authIdentityId: string,
    payload: UpdateSchemaPayload,
  ): Promise<{ id: string; name: string; phone: string; status: string }> {
    const servicePerson = await this.servicePersonRepo.findById(servicePersonId);
    if (!servicePerson) {
      throw new NotFoundError('Service person not found');
    }

    const provider = await this.providerRepo.findById(servicePerson.providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (provider.authIdentityId !== authIdentityId) {
      throw new ForbiddenError('Only the provider can update service person details');
    }

    const updatePayload: UpdateServicePersonRepositoryPayload = {};
    if (payload.name !== undefined) updatePayload.name = payload.name;
    if (payload.phone !== undefined) updatePayload.phone = payload.phone;
    if (payload.email !== undefined) updatePayload.email = payload.email;
    if (payload.role !== undefined) updatePayload.role = payload.role;
    if (payload.isActive !== undefined) updatePayload.isActive = payload.isActive;
    const providerServiceIds = (payload as { providerServiceIds?: string[] })
      .providerServiceIds;
    if (providerServiceIds !== undefined) {
      const valid =
        await this.servicePersonRepo.validateProviderServiceIdsBelongToProvider(
          servicePerson.providerId,
          providerServiceIds,
        );
      if (!valid) {
        throw new BadRequestError(
          'One or more service type IDs do not belong to this provider',
        );
      }
      updatePayload.providerServiceIds = providerServiceIds;
    }

    const updated = await this.servicePersonRepo.update(servicePersonId, updatePayload);

    logger.info('Service person updated', {
      servicePersonId,
      updatedFields: Object.keys(updatePayload),
    });

    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      status: updated.status,
    };
  }

  /** Provider or the service person (when authIdentityId is set) can update status. */
  async updateStatus(
    servicePersonId: string,
    authIdentityId: string,
    payload: UpdateServicePersonStatusPayload,
  ): Promise<{ id: string; status: string }> {
    const servicePerson = await this.servicePersonRepo.findById(servicePersonId);
    if (!servicePerson) {
      throw new NotFoundError('Service person not found');
    }

    const provider = await this.providerRepo.findById(servicePerson.providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    const isProvider = provider.authIdentityId === authIdentityId;
    const isWorker = servicePerson.authIdentityId === authIdentityId;
    if (!isProvider && !isWorker) {
      throw new ForbiddenError('Access denied');
    }

    const updated = await this.servicePersonRepo.updateStatus(
      servicePersonId,
      payload.status as 'AVAILABLE' | 'BUSY' | 'OFF_DUTY',
    );

    logger.info('Service person status updated', {
      servicePersonId,
      status: updated.status,
    });

    return { id: updated.id, status: updated.status };
  }

  async deactivate(servicePersonId: string, authIdentityId: string): Promise<{ id: string }> {
    const servicePerson = await this.servicePersonRepo.findById(servicePersonId);
    if (!servicePerson) {
      throw new NotFoundError('Service person not found');
    }

    const provider = await this.providerRepo.findById(servicePerson.providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    if (provider.authIdentityId !== authIdentityId) {
      throw new ForbiddenError('Only the provider can deactivate a service person');
    }

    const updated = await this.servicePersonRepo.deactivate(servicePersonId);

    logger.info('Service person deactivated', { servicePersonId });

    return { id: updated.id };
  }
}
