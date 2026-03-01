import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel | null = null;

export async function getRabbitConnection(
  url: string,
): Promise<ChannelModel> {
  let conn = connection;
  if (!conn) {
    conn = await amqp.connect(url);
    connection = conn;
    conn.on('error', () => {
      connection = null;
    });
    conn.on('close', () => {
      connection = null;
    });
  }
  return conn;
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
