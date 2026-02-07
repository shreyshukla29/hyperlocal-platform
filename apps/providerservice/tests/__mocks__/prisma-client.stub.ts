/** Stub for generated Prisma client so tests run without prisma generate. */
export class PrismaClient {
  provider = {
    upsert: () => Promise.resolve({}),
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    update: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };
  providerService = { create: () => Promise.resolve({}), findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), update: () => Promise.resolve({}), delete: () => Promise.resolve({}), count: () => Promise.resolve(0) };
  providerAvailability = { create: () => Promise.resolve({}), findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), deleteMany: () => Promise.resolve({}) };
  servicePerson = { create: () => Promise.resolve({}), findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), update: () => Promise.resolve({}), count: () => Promise.resolve(0) };
}
export type Provider = { id: string; authIdentityId: string; firstName: string; lastName: string; isActive: boolean; isDeleted: boolean };
