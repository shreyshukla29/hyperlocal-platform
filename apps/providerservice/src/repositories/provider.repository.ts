import { prisma as defaultPrisma } from '../config/index.js';
import { Provider } from '../generated/prisma/client.js';
import type {
  CreateProviderPayload,
  UpdateProviderRepositoryPayload,
  TopProvidersByLocationQuery,
  PaginatedProvidersResult,
  TopProviderListItem,
} from '../types/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ProviderRepository {
  constructor(private prisma = defaultPrisma) {}

  async createProvider(payload: CreateProviderPayload): Promise<Provider> {
    const { authIdentityId, firstName, lastName, email = null, phone = null } =
      payload;

    return this.prisma.provider.upsert({
      where: { authIdentityId },
      update: {},
      create: {
        authIdentityId,
        firstName,
        lastName,
        email,
        phone,
      },
    });
  }

  async findByAuthIdentityId(authIdentityId: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { authIdentityId },
    });
  }

  async findById(providerId: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { id: providerId },
    });
  }

  async updateProfile(
    providerId: string,
    payload: UpdateProviderRepositoryPayload,
  ): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { ...payload, updatedAt: new Date() },
    });
  }

  async updateVerificationStatus(
    providerId: string,
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED',
  ): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { verificationStatus, updatedAt: new Date() },
    });
  }

  async findTopByLocation(
    query: TopProvidersByLocationQuery,
  ): Promise<PaginatedProvidersResult> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: {
      isActive: boolean;
      isDeleted: boolean;
      city?: { equals: string; mode: 'insensitive' };
    } = {
      isActive: true,
      isDeleted: false,
    };
    if (query.city !== undefined && query.city.trim() !== '') {
      where.city = { equals: query.city.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          city: true,
          latitude: true,
          longitude: true,
          verificationStatus: true,
          availabilityStatus: true,
          createdAt: true,
        },
        orderBy: [
          { verificationStatus: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.provider.count({ where }),
    ]);

    const list: TopProviderListItem[] = items.map((row: (typeof items)[number]) => ({
      id: row.id,
      businessName: row.businessName,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
      verificationStatus: row.verificationStatus,
      availabilityStatus: row.availabilityStatus,
      createdAt: row.createdAt,
    }));

    return {
      items: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
