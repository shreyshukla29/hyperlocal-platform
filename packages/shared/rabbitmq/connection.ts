import amqp, { Connection, Channel } from 'amqplib';

let connection: Connection | null = null;

export async function getRabbitConnection(
  url: string,
): Promise<Connection> {
  if (!connection) {
    connection = await amqp.connect(url);
  }
  return connection;
}

export async function createChannel(url: string): Promise<Channel> {
  const conn = await getRabbitConnection(url);
  return conn.createChannel();
}