import { createChannel } from '@hyperlocal/shared/rabbitmq';
import { AUTH_EXCHANGE, ROUTING_KEYS } from '@hyperlocal/shared/constants';
import { UserSignedUpEvent } from '@hyperlocal/shared/events';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config';
import { UserService } from '../service';
import { UserRepository } from '../repositories';
import { MessageMetadata } from '../types';


const MAIN_QUEUE = 'user-service.user-signed-up';
const DLQ_QUEUE = 'user-service.user-signed-up.dlq';

const RETRY_QUEUES = [
  {
    name: 'user-service.user-signed-up.retry.1',
    ttl: 5_000,
  },
  {
    name: 'user-service.user-signed-up.retry.2',
    ttl: 10_000,
  },
  {
    name: 'user-service.user-signed-up.retry.3',
    ttl: 20_000,
  },
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
      logger.warn('RabbitMQ channel closed, restarting consumer...');
      setTimeout(startUserSignedUpConsumer, 5000);
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

 
    await channel.assertQueue(DLQ_QUEUE, {
      durable: true,
    });

 
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

          try {
            await userService.createUser({
              authIdentityId: payload.authIdentityId,
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              phone: payload.phone,
            });

            logger.info('User created from USER_SIGNED_UP event', {
              authIdentityId: payload.authIdentityId,
              retryCount: metadata.retryCount,
            });

            channel.ack(msg);
          } catch (err: unknwon) {
            const retryCount = metadata.retryCount;

            logger.error('USER_SIGNED_UP processing failed', {
              error: err.message,
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
            error: parseError.message,
            raw: msg.content.toString(),
          });

          channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );

    logger.info('UserSignedUp consumer started', {
      queue: MAIN_QUEUE,
      retryQueues: RETRY_QUEUES.map((q) => q.name),
      dlq: DLQ_QUEUE,
    });
  } catch (error: unknwon) {
    console.log(error)
    logger.error('Failed to start UserSignedUp consumer', error);
    setTimeout(startUserSignedUpConsumer, 10_000);
  }
}
