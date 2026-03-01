import { prisma as defaultPrisma } from '../config/index.js';
import type {
  SearchQuery,
  TopServicesQuery,
  SearchServiceItem,
  PaginatedSearchResult,
} from '../types/search.types.js';
import { ProviderServiceStatus } from '../generated/prisma/enums.js';
import type { ProviderServiceWhereInput } from '../generated/prisma/models/ProviderService.js';

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

  async searchServices(query: SearchQuery): Promise<PaginatedSearchResult<SearchServiceItem>> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const whereBase: {
      status: (typeof ProviderServiceStatus)[keyof typeof ProviderServiceStatus];
      provider: { isActive: boolean; isDeleted: boolean; verificationStatus?: string; city?: { equals: string; mode: 'insensitive' } };
    } = {
      status: ProviderServiceStatus.ACTIVE,
      provider: { isActive: true, isDeleted: false },
    };
    if (query.verifiedOnly === true) {
      whereBase.provider.verificationStatus = 'VERIFIED';
    }
    if (query.city?.trim()) {
      whereBase.provider.city = { equals: query.city.trim(), mode: 'insensitive' };
    }
    type WhereInput = ProviderServiceWhereInput;
    const where: WhereInput = { ...whereBase } as WhereInput;
    if (query.category?.trim()) {
      (where as WhereInput & { category?: unknown }).category = {
        contains: query.category.trim(),
        mode: 'insensitive',
      };
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      (where as WhereInput & { OR?: unknown }).OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
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
        orderBy: [{ provider: { verificationStatus: 'desc' } }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({ where }),
    ]);

    type Row = Parameters<typeof toSearchItem>[0];
    return {
      items: items.map((row: unknown) => toSearchItem(row as Row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTopServices(query: TopServicesQuery): Promise<PaginatedSearchResult<SearchServiceItem>> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: {
      status: (typeof ProviderServiceStatus)[keyof typeof ProviderServiceStatus];
      provider: { isActive: boolean; isDeleted: boolean; verificationStatus?: string; city?: { equals: string; mode: 'insensitive' } };
    } = {
      status: ProviderServiceStatus.ACTIVE,
      provider: { isActive: true, isDeleted: false },
    };
    if (query.verifiedOnly === true) {
      where.provider.verificationStatus = 'VERIFIED';
    }
    if (query.city?.trim()) {
      where.provider.city = { equals: query.city.trim(), mode: 'insensitive' };
    }

    type WhereInput = ProviderServiceWhereInput;
    const [items, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where: where as WhereInput,
        include: {
          provider: {
            select: {
              businessName: true,
              city: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: [{ provider: { verificationStatus: 'desc' } }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({ where: where as WhereInput }),
    ]);

    type Row = Parameters<typeof toSearchItem>[0];
    return {
      items: items.map((row: unknown) => toSearchItem(row as Row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
