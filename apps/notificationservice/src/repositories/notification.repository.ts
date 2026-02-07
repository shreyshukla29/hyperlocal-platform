import { prisma as defaultPrisma } from '../config/index.js';
import type {
  CreateNotificationPayload,
  NotificationResponse,
  ListNotificationsQuery,
  PaginatedNotificationsResult,
} from '../types/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toResponse(row: {
  id: string;
  userAuthId: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  metadata: unknown;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: row.id,
    userAuthId: row.userAuthId,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt,
  };
}

export class NotificationRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(payload: CreateNotificationPayload): Promise<NotificationResponse> {
    const row = await this.prisma.notification.create({
      data: {
        userAuthId: payload.userAuthId,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        metadata: payload.metadata ?? undefined,
      },
    });
    return toResponse(row);
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUser(
    userAuthId: string,
    query?: ListNotificationsQuery,
  ): Promise<PaginatedNotificationsResult> {
    const page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query?.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: { userAuthId: string; readAt?: null } = {
      userAuthId,
    };
    if (query?.unreadOnly) {
      where.readAt = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((row) => toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markAsRead(id: string, userAuthId: string): Promise<NotificationResponse | null> {
    try {
      const row = await this.prisma.notification.updateMany({
        where: { id, userAuthId, readAt: null },
        data: { readAt: new Date() },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.notification.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  async markAllAsRead(userAuthId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userAuthId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}
