import { User } from '../../src/generated/prisma/client';
import { CreateUserPayload, CreateAddressData } from '../../src/types';
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
  error.code = code as unknown;
  error.meta = { target };
  error.clientVersion = 'test';
  return error;
};

export interface MockAddress {
  id: string;
  userId: string;
  label: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockAddress = (overrides?: Partial<MockAddress>): MockAddress => ({
  id: 'addr-123',
  userId: 'user-123',
  label: 'Home',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'City',
  state: 'State',
  postalCode: '12345',
  country: 'Country',
  latitude: 12.34,
  longitude: 56.78,
  isDefault: true,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockAddressWithUser extends MockAddress {
  user: {
    id: string;
    authIdentityId: string;
    isActive: boolean;
    isDeleted: boolean;
  };
}

export const createMockAddressWithUser = (overrides?: Partial<MockAddressWithUser>): MockAddressWithUser => ({
  ...createMockAddress(),
  user: {
    id: 'user-123',
    authIdentityId: 'auth-123',
    isActive: true,
    isDeleted: false,
  },
  ...overrides,
});

export const createMockCreateAddressPayload = (overrides?: Partial<CreateAddressData>): CreateAddressData => ({
  label: 'Home',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'City',
  state: 'State',
  postalCode: '12345',
  country: 'Country',
  latitude: 12.34,
  longitude: 56.78,
  isDefault: false,
  ...overrides,
});
