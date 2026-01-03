import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  GATEWAY_API_KEY: string;
  JWT_SECRET: string;
  RABBITMQ_URL : string;
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
};

export const ServerConfig: ServerConfigType = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: required('DATABASE_URL'),
  GATEWAY_API_KEY: required('GATEWAY_API_KEY'),
  JWT_SECRET: required("JWT_SECRET"),
  RABBITMQ_URL : required("RABBITMQ_URL")
};
