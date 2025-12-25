import dotenv from 'dotenv';

dotenv.config();

interface ServerConfigType {
  PORT?: string;
}

const ServerConfig: ServerConfigType = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development'
};

export default  ServerConfig ;
