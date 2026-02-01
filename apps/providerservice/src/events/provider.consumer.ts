import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/constants';
import { UserSignedUpEvent, MessageMetadata } from '@hyperlocal/shared/events';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config';
import { ProviderService } from '../service';
import { ProviderRepository } from '../repositories';

const MAIN_QUEUE = 'provider-service.user-signed-up';
const DLQ_QUEUE = 'provider-service.user-signed-up.dlq';

const RETRY_QUEUES = [
  { name: 'provider-service.user-signed-up.retry.1', ttl: 5_000 },
  { name: 'provider-service.user-signed-up.retry.2', ttl: 10_000 },
  { name: 'provider-service.user-signed-up.retry.3', ttl: 20_000 },
];

const MAX_RETRIES = RETRY_QUEUES.length;

function parseMessage(msg: Buffer): {
  payload: UserSignedUpEvent;
  metadata: MessageMetadata;
} {
  const content = JSON.parse(msg.toString());
  if (!content || !content.payload) {
    throw new Error('Invalid message format');
  }
  return {
    payload: content.payload,
    metadata: content.metadata ?? {
      retryCount: 0,
      originalTimestamp: Date.now(),
    },
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

export async function startProviderSignedUpConsumer(): Promise<void> {
  const providerRepository = new ProviderRepository();
  const providerService = new ProviderService(providerRepository);

  let channel;

  try {
    channel = await createChannel(ServerConfig.RABBITMQ_URL);

    channel.on('error', (err) => {
      logger.error('RabbitMQ channel error', err);
    });

    channel.on('close', () => {
      logger.warn('RabbitMQ channel closed, restarting consumer...');
      setTimeout(startProviderSignedUpConsumer, 5000);
    });

    await channel.assertExchange(AUTH_EXCHANGE, 'topic', { durable: true });

    await channel.assertQueue(MAIN_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DLQ_QUEUE,
      },
    });

    for (const retryQueue of RETRY_QUEUES) {
      await channel.assertQueue(retryQueue.name, {
        durable: true,
        arguments: {
          'x-message-ttl': retryQueue.ttl,
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': MAIN_QUEUE,
        },
      });
    }

    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    await channel.bindQueue(
      MAIN_QUEUE,
      AUTH_EXCHANGE,
      ROUTING_KEYS.USER_SIGNED_UP,
    );

    await channel.prefetch(10);

    channel.consume(
      MAIN_QUEUE,
      async (msg) => {
        if (!msg) return;

        try {
          const { payload, metadata } = parseMessage(msg.content);

          if (payload.accountType !== 'PROVIDER') {
            channel.ack(msg);
            return;
          }

          try {
            await providerService.createProvider({
              authIdentityId: payload.authIdentityId,
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              phone: payload.phone,
            });

            logger.info('Provider created from USER_SIGNED_UP event', {
              authIdentityId: payload.authIdentityId,
              retryCount: metadata.retryCount,
            });

            channel.ack(msg);
          } catch (err: unknown) {
            const retryCount = metadata.retryCount;

            logger.error('USER_SIGNED_UP (PROVIDER) processing failed', {
              error: err instanceof Error ? err.message : 'Unknown error',
              authIdentityId: payload.authIdentityId,
              retryCount,
            });

            if (retryCount >= MAX_RETRIES) {
              logger.error('Max retries exceeded, sending to DLQ', {
                authIdentityId: payload.authIdentityId,
              });
              channel.nack(msg, false, false);
              return;
            }

            const retryQueue = RETRY_QUEUES[retryCount];
            const retryMessage = createRetryMessage(payload, metadata);

            channel.sendToQueue(retryQueue.name, retryMessage, {
              persistent: true,
              headers: {
                'x-original-queue': MAIN_QUEUE,
                'x-retry-count': retryCount + 1,
              },
            });

            channel.ack(msg);
          }
        } catch (parseError: unknown) {
          logger.error('Message parsing failed, sending to DLQ', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            raw: msg.content.toString(),
          });
          channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );

    logger.info('ProviderSignedUp consumer started', {
      queue: MAIN_QUEUE,
      retryQueues: RETRY_QUEUES.map((q) => q.name),
      dlq: DLQ_QUEUE,
    });
  } catch (error: unknown) {
    logger.error('Failed to start ProviderSignedUp consumer', error);
    setTimeout(startProviderSignedUpConsumer, 10_000);
  }
}
