/** Stub for generated Prisma client so tests run without prisma generate. */
export class PrismaClient {
  identity = {
    create: () => Promise.resolve({}),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    update: () => Promise.resolve({}),
  };
  identityVerification = {
    create: () => Promise.resolve({}),
    findFirst: () => Promise.resolve(null),
    update: () => Promise.resolve({}),
    updateMany: () => Promise.resolve({ count: 0 }),
    findMany: () => Promise.resolve([]),
  };
}
export type Identity = { id: string; email: string | null; phone: string | null; password: string; accountType: string; isActive: boolean };
export type IdentityVerification = { id: string; identityId: string; type: string; value: string; otpHash: string | null; otpExpiresAt: Date | null; verifiedAt: Date | null };
export type VerificationType = 'EMAIL' | 'PHONE';
export type AccountType = 'USER' | 'PROVIDER';
