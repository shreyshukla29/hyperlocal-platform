import { prisma as defaultPrisma } from '../config/index.js';
import { ServicePerson } from '../generated/prisma/client.js';
import {
  CreateServicePersonPayload,
  UpdateServicePersonRepositoryPayload,
  ListServicePeopleQuery,
} from '../types/index.js';

export class ServicePersonRepository {
  constructor(private prisma = defaultPrisma) {}

  /** Ensure all providerServiceIds belong to the given provider. */
  async validateProviderServiceIdsBelongToProvider(
    providerId: string,
    providerServiceIds: string[],
  ): Promise<boolean> {
    if (providerServiceIds.length === 0) return true;
    const count = await this.prisma.providerService.count({
      where: { id: { in: providerServiceIds }, providerId },
    });
    return count === providerServiceIds.length;
  }

  async create(payload: CreateServicePersonPayload): Promise<ServicePerson> {
    const {
      providerId,
      name,
      phone,
      email = null,
      role = null,
      providerServiceIds = [],
    } = payload;

    const servicePerson = await this.prisma.servicePerson.create({
      data: { providerId, name, phone, email, role },
    });

    if (providerServiceIds.length > 0) {
      await this.prisma.servicePersonProviderService.createMany({
        data: providerServiceIds.map((providerServiceId) => ({
          servicePersonId: servicePerson.id,
          providerServiceId,
        })),
        skipDuplicates: true,
      });
    }

    return servicePerson;
  }

  async findById(servicePersonId: string): Promise<ServicePerson | null> {
    return this.prisma.servicePerson.findUnique({
      where: { id: servicePersonId },
    });
  }

  async findByIdWithProviderAndServices(
    servicePersonId: string,
  ): Promise<(ServicePerson & {
    provider: { id: string; businessName: string | null; firstName: string; lastName: string };
    servicePersonProviderServices: { providerService: { id: string; name: string; category: string | null } }[];
  }) | null> {
    return this.prisma.servicePerson.findUnique({
      where: { id: servicePersonId },
      include: {
        provider: {
          select: { id: true, businessName: true, firstName: true, lastName: true },
        },
        servicePersonProviderServices: {
          include: { providerService: { select: { id: true, name: true, category: true } } },
        },
      },
    }) as Promise<(ServicePerson & {
      provider: { id: string; businessName: string | null; firstName: string; lastName: string };
      servicePersonProviderServices: { providerService: { id: string; name: string; category: string | null } }[];
    }) | null>;
  }

  async findByProviderId(
    providerId: string,
    query?: ListServicePeopleQuery,
  ): Promise<(ServicePerson & {
    provider: { id: string; businessName: string | null; firstName: string; lastName: string };
    servicePersonProviderServices: { providerService: { id: string; name: string; category: string | null } }[];
  })[]> {
    const where: {
      providerId: string;
      status?: unknown;
      isActive?: boolean;
      servicePersonProviderServices?: { some: { providerServiceId: string } };
    } = { providerId };
    if (query?.status !== undefined) where.status = query.status;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.providerServiceId) {
      where.servicePersonProviderServices = {
        some: { providerServiceId: query.providerServiceId },
      };
    }

    return this.prisma.servicePerson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          select: { id: true, businessName: true, firstName: true, lastName: true },
        },
        servicePersonProviderServices: {
          include: { providerService: { select: { id: true, name: true, category: true } } },
        },
      },
    }) as Promise<(ServicePerson & {
      provider: { id: string; businessName: string | null; firstName: string; lastName: string };
      servicePersonProviderServices: { providerService: { id: string; name: string; category: string | null } }[];
    })[]>;
  }

  async findByAuthIdentityId(
    authIdentityId: string,
  ): Promise<ServicePerson | null> {
    return this.prisma.servicePerson.findUnique({
      where: { authIdentityId },
    });
  }

  async update(
    servicePersonId: string,
    payload: UpdateServicePersonRepositoryPayload,
  ): Promise<ServicePerson> {
    const { providerServiceIds, ...rest } = payload;
    const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };

    const updated = await this.prisma.servicePerson.update({
      where: { id: servicePersonId },
      data,
    });

    if (providerServiceIds !== undefined) {
      await this.prisma.servicePersonProviderService.deleteMany({
        where: { servicePersonId },
      });
      if (providerServiceIds.length > 0) {
        await this.prisma.servicePersonProviderService.createMany({
          data: providerServiceIds.map((providerServiceId) => ({
            servicePersonId,
            providerServiceId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  }

  async updateStatus(
    servicePersonId: string,
    status: ServicePerson['status'],
  ): Promise<ServicePerson> {
    return this.prisma.servicePerson.update({
      where: { id: servicePersonId },
      data: { status, updatedAt: new Date() },
    });
  }

  async deactivate(servicePersonId: string): Promise<ServicePerson> {
    return this.prisma.servicePerson.update({
      where: { id: servicePersonId },
      data: { isActive: false, updatedAt: new Date() },
    });
  }
}
