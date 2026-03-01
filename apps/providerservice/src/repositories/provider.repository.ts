import { prisma as defaultPrisma } from '../config/index.js';
import { Prisma } from '../generated/prisma/client.js';
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
    verifiedBy?: string,
  ): Promise<Provider> {
    const now = new Date();
    const data =
      verificationStatus === 'VERIFIED' && verifiedBy != null
        ? { verificationStatus, updatedAt: now, verifiedAt: now, verifiedBy }
        : { verificationStatus, updatedAt: now, verifiedAt: null, verifiedBy: null };
    return this.prisma.provider.update({
      where: { id: providerId },
      data: data as Parameters<typeof this.prisma.provider.update>[0]['data'],
    });
  }

  async findTopByLocation(
    query: TopProvidersByLocationQuery,
  ): Promise<PaginatedProvidersResult> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const useGeo =
      query.latitude != null &&
      query.longitude != null &&
      Number.isFinite(query.latitude) &&
      Number.isFinite(query.longitude);

    if (useGeo) {
      return this.findTopByLocationWithGeo(query, page, limit, skip);
    }

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
          averageRating: true,
          reviewCount: true,
          verificationStatus: true,
          availabilityStatus: true,
          createdAt: true,
        },
        orderBy: [
          { averageRating: 'desc' },
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
      averageRating: row.averageRating,
      reviewCount: row.reviewCount ?? 0,
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

  /** Geo path: filter/sort by provider lat/long and optional radius; order by rating then distance. */
  private async findTopByLocationWithGeo(
    query: TopProvidersByLocationQuery,
    page: number,
    limit: number,
    skip: number,
  ): Promise<PaginatedProvidersResult> {
    const lat = Number(query.latitude);
    const lng = Number(query.longitude);
    const radiusKm = query.radiusKm != null && query.radiusKm > 0 ? query.radiusKm : null;
    const city =
      query.city !== undefined && query.city.trim() !== ''
        ? query.city.trim()
        : null;

    // Haversine distance in km. Param order: lat, lng, radiusKm, city, limit, skip.
    const hav = Prisma.sql`6371 * acos(least(1, greatest(-1, cos(radians(${lat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.latitude)))))`;
    const cityCondition = city
      ? Prisma.sql`AND LOWER(TRIM(p.city)) = LOWER(TRIM(${city}))`
      : Prisma.empty;

    const whereClause = Prisma.sql`
      WHERE p."isActive" = true AND p."isDeleted" = false
        AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        ${cityCondition}
    `;

    type Row = {
      id: string;
      businessName: string | null;
      city: string | null;
      latitude: number | null;
      longitude: number | null;
      averageRating: number | null;
      reviewCount: number;
      verificationStatus: string;
      availabilityStatus: string;
      createdAt: Date;
      distance: number;
    };

    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        WITH with_distance AS (
          SELECT p.id, ${hav} AS distance
          FROM providers p
          ${whereClause}
        )
        SELECT COUNT(*)::bigint AS count FROM with_distance
        WHERE (${radiusKm}::float IS NULL OR distance <= ${radiusKm})
      `,
    );
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.prisma.$queryRaw<Row[]>(
      Prisma.sql`
        WITH with_distance AS (
          SELECT
            p.id,
            p."businessName",
            p.city,
            p.latitude,
            p.longitude,
            p."averageRating",
            p."reviewCount",
            p."verificationStatus",
            p."availabilityStatus",
            p."createdAt",
            ${hav} AS distance
          FROM providers p
          ${whereClause}
        )
        SELECT * FROM with_distance
        WHERE (${radiusKm}::float IS NULL OR distance <= ${radiusKm})
        ORDER BY "averageRating" DESC NULLS LAST, distance ASC NULLS LAST, "verificationStatus" DESC, "createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
    );

    const list: TopProviderListItem[] = rows.map((row) => ({
      id: row.id,
      businessName: row.businessName,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
      averageRating: row.averageRating,
      reviewCount: row.reviewCount ?? 0,
      verificationStatus: row.verificationStatus as TopProviderListItem['verificationStatus'],
      availabilityStatus: row.availabilityStatus as TopProviderListItem['availabilityStatus'],
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
