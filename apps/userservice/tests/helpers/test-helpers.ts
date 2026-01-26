import { User } from '../../src/generated/prisma/client';
import { CreateUserPayload } from '../../src/types';
import { Prisma } from '../../src/generated/prisma/client';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  authIdentityId: 'auth-123',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  phone: '+1234567890',
  avatarUrl: null,
  isActive: true,
  isDeleted: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockUserPayload = (
  overrides?: Partial<CreateUserPayload>,
): CreateUserPayload => ({
  authIdentityId: 'auth-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  username: 'johndoe',
  ...overrides,
});

export const createMockPrismaError = (code: string, target?: string[]): Prisma.PrismaClientKnownRequestError => {
  const error = new Error('Prisma error') as Prisma.PrismaClientKnownRequestError;
  error.code = code as any;
  error.meta = { target };
  error.clientVersion = 'test';
  return error;
};
