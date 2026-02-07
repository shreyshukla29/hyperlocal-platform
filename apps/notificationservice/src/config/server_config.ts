import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  GATEWAY_API_KEY: string;
  RABBITMQ_URL?: string;
  /** SMTP for sending emails. If not set, email sending is skipped. */
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
};

export const ServerConfig: ServerConfigType = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  GATEWAY_API_KEY: required('GATEWAY_API_KEY'),
  DATABASE_URL: required('DATABASE_URL'),
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
};
