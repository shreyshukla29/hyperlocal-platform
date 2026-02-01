import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  GATEWAY_API_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
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
  RAZORPAY_KEY_ID: required('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: required('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: required('RAZORPAY_WEBHOOK_SECRET'),
};
