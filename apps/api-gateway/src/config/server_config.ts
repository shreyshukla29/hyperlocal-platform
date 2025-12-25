import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string
  NODE_ENV?:string,
  JWT_SECRET: string

}

export const ServerConfig: ServerConfigType = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET : process.env.JWT_SECRET 
};

