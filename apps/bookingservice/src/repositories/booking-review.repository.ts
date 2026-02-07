import { prisma as defaultPrisma } from '../config/index.js';

export interface CreateReviewPayload {
  bookingId: string;
  userAuthId: string;
  providerId: string;
  providerServiceId: string;
  rating: number;
  comment?: string | null;
}

export interface ReviewResponse {
  id: string;
  bookingId: string;
  userAuthId: string;
  providerId: string;
  providerServiceId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface ListReviewsQuery {
  providerId?: string;
  providerServiceId?: string;
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class BookingReviewRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(payload: CreateReviewPayload) {
    const row = await this.prisma.bookingReview.create({
      data: {
        bookingId: payload.bookingId,
        userAuthId: payload.userAuthId,
        providerId: payload.providerId,
        providerServiceId: payload.providerServiceId,
        rating: payload.rating,
        comment: payload.comment ?? null,
      },
    });
    return this.toResponse(row);
  }

  async findByBookingId(bookingId: string) {
    const row = await this.prisma.bookingReview.findUnique({
      where: { bookingId },
    });
    return row ? this.toResponse(row) : null;
  }

  async findByProvider(
    providerId: string,
    query?: ListReviewsQuery,
  ): Promise<{ items: ReviewResponse[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query?.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const where: { providerId: string; providerServiceId?: string } = { providerId };
    if (query?.providerServiceId) where.providerServiceId = query.providerServiceId;
    const [items, total] = await Promise.all([
      this.prisma.bookingReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookingReview.count({ where }),
    ]);
    return {
      items: items.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private toResponse(row: {
    id: string;
    bookingId: string;
    userAuthId: string;
    providerId: string;
    providerServiceId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }): ReviewResponse {
    return {
      id: row.id,
      bookingId: row.bookingId,
      userAuthId: row.userAuthId,
      providerId: row.providerId,
      providerServiceId: row.providerServiceId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
    };
  }
}
