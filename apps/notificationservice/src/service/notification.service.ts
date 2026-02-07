import { NotificationRepository } from '../repositories/index.js';
import type {
  CreateNotificationPayload,
  NotificationResponse,
  ListNotificationsQuery,
  PaginatedNotificationsResult,
} from '../types/index.js';
import { NotFoundError, ForbiddenError } from '@hyperlocal/shared/errors';

export class NotificationService {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async create(payload: CreateNotificationPayload): Promise<NotificationResponse> {
    return this.notificationRepo.create(payload);
  }

  async listByUser(
    userAuthId: string,
    query?: ListNotificationsQuery,
  ): Promise<PaginatedNotificationsResult> {
    return this.notificationRepo.findByUser(userAuthId, query);
  }

  async getById(id: string, userAuthId: string): Promise<NotificationResponse> {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    if (notification.userAuthId !== userAuthId) {
      throw new ForbiddenError('Access denied: not your notification');
    }
    return {
      id: notification.id,
      userAuthId: notification.userAuthId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt,
      metadata: notification.metadata as Record<string, unknown> | null,
      createdAt: notification.createdAt,
    };
  }

  async markAsRead(id: string, userAuthId: string): Promise<NotificationResponse> {
    const updated = await this.notificationRepo.markAsRead(id, userAuthId);
    if (!updated) {
      const notification = await this.notificationRepo.findById(id);
      if (!notification) throw new NotFoundError('Notification not found');
      if (notification.userAuthId !== userAuthId) {
        throw new ForbiddenError('Access denied: not your notification');
      }
      return this.getById(id, userAuthId);
    }
    return updated;
  }

  async markAllAsRead(userAuthId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.markAllAsRead(userAuthId);
    return { count };
  }
}
