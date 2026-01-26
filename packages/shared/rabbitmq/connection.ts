import amqp, { Connection, Channel } from 'amqplib';

let connection: Connection | null = null;

export async function getRabbitConnection(
  url: string,
): Promise<Connection> {
  if (!connection) {
    connection = await amqp.connect(url);

    connection.on('error', () => {
      connection = null;
    });

    connection.on('close', () => {
      connection = null;
    });
  }

  return connection;
}

export async function createChannel(url: string): Promise<Channel> {
  const conn = await getRabbitConnection(url);
  const channel = await conn.createChannel();

  channel.on('error', () => {
    channel.close().catch(() => {});
  });

  channel.on('close', () => {});

  return channel;
}
