import { VerificationType } from '../generated/prisma/client';

export interface CreateIdentityInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  accountTypes: string[];
}

export interface LoginLookupInput {
  email?: string;
  phone?: string;
}

export { VerificationType };
