import { prisma as defaultPrisma } from '../config/index.js';
import type {
  SearchQuery,
  TopServicesQuery,
  SearchServiceItem,
  PaginatedSearchResult,
} from '../types/search.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toSearchItem(row: {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: { toString(): string };
  durationMinutes: number | null;
  status: string;
  createdAt: Date;
  provider: {
    businessName: string | null;
    city: string | null;
    verificationStatus: string;
  };
}): SearchServiceItem {
  return {
    id: row.id,
    providerId: row.providerId,
    providerBusinessName: row.provider.businessName,
    providerCity: row.provider.city,
    providerVerificationStatus: row.provider.verificationStatus,
    name: row.name,
    description: row.description,
    category: row.category,
    price:
      typeof row.price === 'object' && row.price !== null && 'toString' in row.price
        ? row.price.toString()
        : String(row.price),
    durationMinutes: row.durationMinutes,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export class SearchRepository {
  constructor(private prisma = defaultPrisma) {}

  async searchServices(
    query: SearchQuery,
  ): Promise<PaginatedSearchResult<SearchServiceItem>> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      provider: {
        isActive: true,
        isDeleted: false,
      },
    };

    if (query.verifiedOnly === true) {
      (where.provider as Record<string, unknown>).verificationStatus = 'VERIFIED';
    }

    if (query.city?.trim()) {
      (where.provider as Record<string, unknown>).city = {
        equals: query.city.trim(),
        mode: 'insensitive',
      };
    }

    if (query.category?.trim()) {
      where.category = {
        contains: query.category.trim(),
        mode: 'insensitive',
      };
    }

    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const whereInput = where as Parameters<
      typeof this.prisma.providerService.findMany
    >[0]['where'];

    const [items, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where: whereInput,
        include: {
          provider: {
            select: {
              businessName: true,
              city: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: [
          { provider: { verificationStatus: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({ where: whereInput }),
    ]);

    type Row = Parameters<typeof toSearchItem>[0];
    return {
      items: items.map((row: Row) => toSearchItem(row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTopServices(
    query: TopServicesQuery,
  ): Promise<PaginatedSearchResult<SearchServiceItem>> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: {
      status: string;
      provider: {
        isActive: boolean;
        isDeleted: boolean;
        verificationStatus?: string;
        city?: { equals: string; mode: 'insensitive' };
      };
    } = {
      status: 'ACTIVE',
      provider: {
        isActive: true,
        isDeleted: false,
      },
    };

    if (query.verifiedOnly === true) {
      where.provider.verificationStatus = 'VERIFIED';
    }

    if (query.city?.trim()) {
      where.provider.city = { equals: query.city.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where,
        include: {
          provider: {
            select: {
              businessName: true,
              city: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: [
          { provider: { verificationStatus: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({ where }),
    ]);

    type Row = Parameters<typeof toSearchItem>[0];
    return {
      items: items.map((row: Row) => toSearchItem(row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
