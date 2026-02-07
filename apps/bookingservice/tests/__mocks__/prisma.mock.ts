import { jest } from '@jest/globals';

export const mockedPrisma = {
  booking: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
  bookingOtp: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  bookingReview: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
  paymentWebhook: { create: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
} as unknown as Record<string, { [k: string]: jest.Mock }>;
