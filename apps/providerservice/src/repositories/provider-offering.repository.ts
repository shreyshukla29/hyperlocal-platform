import { prisma as defaultPrisma } from '../config/index.js';
import type {
  CreateProviderOfferingPayload,
  UpdateProviderOfferingRepositoryPayload,
  ListProviderOfferingsQuery,
  PaginatedResult,
  ProviderOfferingResponse,
} from '../types/provider-offering.types.js';
import { ProviderServiceStatus } from '../enums/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toResponse(row: {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: { toString(): string };
  durationMinutes: number | null;
  status: ProviderServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}): ProviderOfferingResponse {
  return {
    id: row.id,
    providerId: row.providerId,
    name: row.name,
    description: row.description,
    category: row.category,
    price: typeof row.price === 'object' && row.price !== null && 'toString' in row.price ? row.price.toString() : String(row.price),
    durationMinutes: row.durationMinutes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProviderOfferingRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(payload: CreateProviderOfferingPayload) {
    const row = await this.prisma.providerService.create({
      data: {
        providerId: payload.providerId,
        name: payload.name,
        description: payload.description ?? null,
        category: payload.category ?? null,
        price: payload.price,
        durationMinutes: payload.durationMinutes ?? null,
        status: payload.status ?? ProviderServiceStatus.ACTIVE,
      },
    });
    return toResponse(row);
  }

  async findById(id: string) {
    return this.prisma.providerService.findUnique({
      where: { id },
    });
  }

  async findByIdAndProviderId(id: string, providerId: string) {
    return this.prisma.providerService.findFirst({
      where: { id, providerId },
    });
  }

  async findByProviderId(
    providerId: string,
    query?: ListProviderOfferingsQuery,
  ): Promise<PaginatedResult<ProviderOfferingResponse>> {
    const page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query?.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: { providerId: string; status?: ProviderServiceStatus } = {
      providerId,
    };
    if (query?.status !== undefined) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({ where }),
    ]);

    return {
      items: items.map((row) => toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async update(
    id: string,
    payload: UpdateProviderOfferingRepositoryPayload,
  ) {
    const row = await this.prisma.providerService.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.category !== undefined && { category: payload.category }),
        ...(payload.price !== undefined && { price: payload.price }),
        ...(payload.durationMinutes !== undefined && { durationMinutes: payload.durationMinutes }),
        ...(payload.status !== undefined && { status: payload.status }),
        updatedAt: new Date(),
      },
    });
    return toResponse(row);
  }

  async delete(id: string) {
    await this.prisma.providerService.delete({
      where: { id },
    });
  }
}
