import { prisma as defaultPrisma } from '../config/index.js';

export interface FavouriteResponse {
  id: string;
  userId: string;
  providerId: string;
  createdAt: Date;
}

export class FavouriteRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(userId: string, providerId: string) {
    const row = await this.prisma.userFavourite.create({
      data: { userId, providerId },
    });
    return this.toResponse(row);
  }

  async findByUserAndProvider(userId: string, providerId: string) {
    const row = await this.prisma.userFavourite.findUnique({
      where: {
        userId_providerId: { userId, providerId },
      },
    });
    return row ? this.toResponse(row) : null;
  }

  async listByUserId(userId: string, query?: { page?: number; limit?: number }) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.userFavourite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userFavourite.count({ where: { userId } }),
    ]);
    return {
      items: items.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async delete(userId: string, providerId: string) {
    const row = await this.prisma.userFavourite.deleteMany({
      where: { userId, providerId },
    });
    return row.count > 0;
  }

  private toResponse(row: { id: string; userId: string; providerId: string; createdAt: Date }): FavouriteResponse {
    return {
      id: row.id,
      userId: row.userId,
      providerId: row.providerId,
      createdAt: row.createdAt,
    };
  }
}
