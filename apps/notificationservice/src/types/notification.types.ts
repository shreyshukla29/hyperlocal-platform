export interface NotificationResponse {
  id: string;
  userAuthId: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateNotificationPayload {
  userAuthId: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotificationsResult {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
