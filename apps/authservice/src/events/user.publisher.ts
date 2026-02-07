import { createChannel } from '@hyperlocal/shared/rabbitmq/connection';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/constants';
import { UserSignedUpEvent } from '@hyperlocal/shared/events';
import { logger } from '@hyperlocal/shared/logger';
import {ServerConfig} from '../config/index.js';

export async function publishUserSignedUpEvent(
  payload: UserSignedUpEvent,
): Promise<void> {
  const channel = await createChannel(ServerConfig.RABBITMQ_URL);

  try {
    await channel.assertExchange(AUTH_EXCHANGE, 'topic', {
      durable: true,
    });

    channel.publish(
      AUTH_EXCHANGE,
      ROUTING_KEYS.USER_SIGNED_UP,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );
  } catch (err) {
    logger.error('Failed to publish USER_SIGNED_UP event', err);
  } finally {
    await channel.close();
  }
}