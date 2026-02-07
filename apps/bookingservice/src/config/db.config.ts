import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { ServerConfig } from './server_config.js';

const connectionString = ServerConfig.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
