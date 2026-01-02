import { createChannel } from '@hyperlocal/shared/rabbitmq/connection';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/rabbitmq/constants';
import { UserSignedUpEvent } from '@hyperlocal/shared/events/user.events';
import { logger } from '@hyperlocal/shared/logger';

export async function publishUserSignedUpEvent(
  payload: UserSignedUpEvent,
): Promise<void> {
  const channel = await createChannel(process.env.RABBITMQ_URL!);

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