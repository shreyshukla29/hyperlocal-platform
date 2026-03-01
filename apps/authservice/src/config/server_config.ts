import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  GATEWAY_API_KEY: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  RABBITMQ_URL: string;
  OTP_HASH_SECRET: string;
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
  JWT_SECRET: required('JWT_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_EXPIRY: process.env.JWT_EXPIRY ?? '24h',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  RABBITMQ_URL: required('RABBITMQ_URL'),
  OTP_HASH_SECRET:
    process.env.NODE_ENV === 'production'
      ? required('OTP_HASH_SECRET')
      : (process.env.OTP_HASH_SECRET ?? 'dev-otp-secret-not-for-production'),
};
