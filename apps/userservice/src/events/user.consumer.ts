// apps/userservice/src/events/user.consumer.ts
import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/constants';
import { UserSignedUpEvent } from '@hyperlocal/shared/events';
import { prisma } from '../db';
import { logger } from '@hyperlocal/shared/logger';

const QUEUE_NAME = 'user-service.user-signed-up';

export async function startUserSignedUpConsumer(): Promise<void> {
  const channel = await createChannel(process.env.RABBITMQ_URL!);

  await channel.assertExchange(AUTH_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.bindQueue(
    QUEUE_NAME,
    AUTH_EXCHANGE,
    ROUTING_KEYS.USER_SIGNED_UP,
  );

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(
        msg.content.toString(),
      ) as UserSignedUpEvent;

      await prisma.user.upsert({
        where: { authIdentityId: payload.authIdentityId },
        update: {},
        create: {
          authIdentityId: payload.authIdentityId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        },
      });

      channel.ack(msg);
    } catch (err) {
      logger.error('Failed to process USER_SIGNED_UP event', err);

      // retry later (no DLQ for now)
      channel.nack(msg, false, true);
    }
  });

  logger.info('UserSignedUp consumer started');
}
