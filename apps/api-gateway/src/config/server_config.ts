import dotenv from 'dotenv';

dotenv.config();

interface ServicesConfig {
  AUTH?: string;
  USER?: string;
}

interface ServerConfigType {
  PORT?: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  services: ServicesConfig;
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
};

export const ServerConfig: ServerConfigType = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: required('JWT_SECRET'),
  services: {
    AUTH: process.env.SERVICE_AUTH_URL,
    USER: process.env.SERVICE_USER_URL,
  },
  GATEWAY_API_KEY: required('GATEWAY_API_KEY'),
} as const;
