import { jest } from '@jest/globals';

export const mockedPrisma = {
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as Record<string, { [k: string]: jest.Mock }>;
