import { jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';

export const mockedPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaClient>;
