import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config/index.js';
import {
  initDefaultChannels,
  getRegistry,
  normalizePayload,
  type RawNotificationPayload,
} from '../channels/index.js';

const NOTIFICATION_EXCHANGE = 'notification.events';
const NOTIFICATION_QUEUE = 'notification-service.in-app';
const ROUTING_KEY = 'notification.create';

function parsePayload(msg: Buffer): RawNotificationPayload {
  const content = JSON.parse(msg.toString());
  if (!content?.userAuthId || !content?.type || !content?.title) {
    throw new Error('Invalid notification payload: userAuthId, type, title required');
  }
  return {
    userAuthId: content.userAuthId,
    type: content.type,
    title: content.title,
    body: content.body ?? null,
    metadata: content.metadata ?? null,
    channel: content.channel ?? 'in_app',
    channels: content.channels ?? null,
    emailTo: content.emailTo ?? null,
    phone: content.phone ?? null,
  };
}

export async function startNotificationConsumer(): Promise<void> {
  if (!ServerConfig.RABBITMQ_URL) {
    logger.info('RABBITMQ_URL not set, notification consumer skipped');
    return;
  }

  initDefaultChannels();
  const registry = getRegistry();

  let channel;
  try {
    channel = await createChannel(ServerConfig.RABBITMQ_URL);

    channel.on('error', (err : unknown) => {
      logger.error('Notification consumer channel error', err);
    });

    channel.on('close', () => {
      logger.warn('Notification consumer channel closed, restarting...');
      setTimeout(startNotificationConsumer, 5000);
    });

    await channel.assertExchange(NOTIFICATION_EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
    await channel.bindQueue(NOTIFICATION_QUEUE, NOTIFICATION_EXCHANGE, ROUTING_KEY);
    channel.prefetch(1);

    await channel.consume(
      NOTIFICATION_QUEUE,
      async (msg) => {
        if (!msg) return;
        try {
          const raw = parsePayload(msg.content);
          const payload = normalizePayload(raw);
          await registry.dispatch(payload);
          channel.ack(msg);
        } catch (err) {
          logger.error('Notification consumer error', {
            err,
            msg: msg.content?.toString(),
          });
          channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );

    logger.info('Notification consumer started', {
      exchange: NOTIFICATION_EXCHANGE,
      queue: NOTIFICATION_QUEUE,
      routingKey: ROUTING_KEY,
    });
  } catch (err) {
    logger.error('Failed to start notification consumer', err);
    setTimeout(startNotificationConsumer, 5000);
  }
}
