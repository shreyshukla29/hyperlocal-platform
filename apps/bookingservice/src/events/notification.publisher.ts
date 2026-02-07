import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config/index.js';

const NOTIFICATION_EXCHANGE = 'notification.events';
const ROUTING_KEY = 'notification.create';

export interface NotificationPublishPayload {
  userAuthId: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  /** 'in_app' | 'email' | 'both' – notification service uses this to send in-app and/or email */
  channel?: 'in_app' | 'email' | 'both';
  /** When channel includes email, use this address if provided (else notification service may resolve from userAuthId) */
  emailTo?: string | null;
}

export async function publishNotification(
  payload: NotificationPublishPayload,
): Promise<void> {
  if (!ServerConfig.RABBITMQ_URL) {
    logger.debug('RABBITMQ_URL not set, notification not published', {
      type: payload.type,
    });
    return;
  }

  let channel;
  try {
    channel = await createChannel(ServerConfig.RABBITMQ_URL);
    await channel.assertExchange(NOTIFICATION_EXCHANGE, 'topic', {
      durable: true,
    });
    channel.publish(
      NOTIFICATION_EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );
  } catch (err) {
    logger.error('Failed to publish notification event', { err, type: payload.type });
  } finally {
    try {
      await channel?.close();
    } catch {
      // ignore
    }
  }
}
