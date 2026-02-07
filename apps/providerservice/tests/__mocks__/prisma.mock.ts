import { jest } from '@jest/globals';

export const mockedPrisma = {
  provider: { create: jest.fn(), upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  providerService: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  providerAvailability: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
  servicePerson: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(),
} as unknown as Record<string, { [k: string]: jest.Mock }>;
