import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/constants';
import { UserSignedUpEvent } from '@hyperlocal/shared/events';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config';
import { UserService } from '../service';
import { UserRepository } from '../repositories';
import { MessageMetadata } from '../types';

const QUEUE_NAME = 'user-service.user-signed-up';
const DLQ_NAME = 'user-service.user-signed-up.dlq';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function parseMessageWithMetadata(msg: Buffer): {
  payload: UserSignedUpEvent;
  metadata: MessageMetadata;
} {
  const content = JSON.parse(msg.toString());
  return {
    payload: content.payload || content,
    metadata: content.metadata || { retryCount: 0, originalTimestamp: Date.now() },
  };
}

function createRetryMessage(
  payload: UserSignedUpEvent,
  metadata: MessageMetadata,
): Buffer {
  return Buffer.from(
    JSON.stringify({
      payload,
      metadata: {
        retryCount: metadata.retryCount + 1,
        originalTimestamp: metadata.originalTimestamp,
      },
    }),
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startUserSignedUpConsumer(): Promise<void> {
  const userRepository = new UserRepository();
  const userService = new UserService(userRepository);

  let channel;
  try {
    channel = await createChannel(ServerConfig.RABBITMQ_URL);

    channel.on('error', (err) => {
      logger.error('RabbitMQ channel error', err);
    });

    channel.on('close', () => {
      logger.warn('RabbitMQ channel closed, attempting to reconnect...');
      setTimeout(() => startUserSignedUpConsumer(), 5000);
    });

    await channel.assertExchange(AUTH_EXCHANGE, 'topic', { durable: true });

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DLQ_NAME,
        'x-message-ttl': 300000,
      },
    });

    await channel.assertQueue(DLQ_NAME, {
      durable: true,
    });

    await channel.bindQueue(QUEUE_NAME, AUTH_EXCHANGE, ROUTING_KEYS.USER_SIGNED_UP);

    await channel.prefetch(10);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) return;

        try {
          const { payload, metadata } = parseMessageWithMetadata(msg.content);

          try {
            await userService.createUser({
              authIdentityId: payload.authIdentityId,
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              phone: payload.phone,
            });

            logger.info('User created from event', {
              authIdentityId: payload.authIdentityId,
              retryCount: metadata.retryCount,
            });

            channel.ack(msg);
          } catch (error: any) {
            logger.error('Failed to process USER_SIGNED_UP event', {
              error: error.message,
              authIdentityId: payload.authIdentityId,
              retryCount: metadata.retryCount,
            });

            if (metadata.retryCount >= MAX_RETRIES) {
              logger.error('Max retries reached, sending to DLQ', {
                authIdentityId: payload.authIdentityId,
                retryCount: metadata.retryCount,
              });

              channel.sendToQueue(DLQ_NAME, msg.content, {
                persistent: true,
                headers: {
                  'x-original-queue': QUEUE_NAME,
                  'x-failure-reason': error.message,
                  'x-failed-at': new Date().toISOString(),
                },
              });

              channel.ack(msg);
            } else {
              await sleep(RETRY_DELAY_MS * (metadata.retryCount + 1));

              const retryMessage = createRetryMessage(payload, metadata);

              channel.sendToQueue(QUEUE_NAME, retryMessage, {
                persistent: true,
              });

              channel.ack(msg);
            }
          }
        } catch (parseError: any) {
          logger.error('Failed to parse message', {
            error: parseError.message,
            content: msg.content.toString(),
          });

          channel.sendToQueue(DLQ_NAME, msg.content, {
            persistent: true,
            headers: {
              'x-original-queue': QUEUE_NAME,
              'x-failure-reason': 'Message parsing failed',
              'x-failed-at': new Date().toISOString(),
            },
          });

          channel.ack(msg);
        }
      },
      { noAck: false },
    );

    logger.info('UserSignedUp consumer started', {
      queue: QUEUE_NAME,
      dlq: DLQ_NAME,
      maxRetries: MAX_RETRIES,
    });
  } catch (error: any) {
    logger.error('Failed to start UserSignedUp consumer', error);
    setTimeout(() => startUserSignedUpConsumer(), 10000);
  }
}
