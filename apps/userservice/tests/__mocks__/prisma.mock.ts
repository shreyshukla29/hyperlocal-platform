import { jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';

export const mockedPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  address: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as jest.Mocked<PrismaClient>;
