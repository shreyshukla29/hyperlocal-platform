import { prisma } from '../config';
import {
  Identity,
  IdentityVerification,
  VerificationType,
} from '@prisma/client';
import { normalizeEmail, normalizePhone } from './utils';

export class AuthRepository {
  /* ============================
     Identity Queries
  ============================ */

  async createIdentity(data: {
    email?: string;
    phone?: string;
    passwordHash: string;
    accountTypes: string[];
  }): Promise<Identity> {
    return prisma.identity.create({
      data: {
        email: data.email ? normalizeEmail(data.email) : null,
        phone: data.phone ? normalizePhone(data.phone) : null,
        passwordHash: data.passwordHash,
        accountTypes: data.accountTypes,
      },
    });
  }

  async findByEmail(email: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: {
        email: normalizeEmail(email),
      },
    });
  }

  async findByPhone(phone: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: {
        phone: normalizePhone(phone),
      },
    });
  }

  async findById(identityId: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: { id: identityId },
    });
  }

  async deactivateIdentity(identityId: string): Promise<void> {
    await prisma.identity.update({
      where: { id: identityId },
      data: { isActive: false },
    });
  }

  /* ============================
     Verification Queries
  ============================ */

  async createVerification(
    identityId: string,
    type: VerificationType,
    value: string
  ): Promise<IdentityVerification> {
    return prisma.identityVerification.create({
      data: {
        identityId,
        type,
        value,
      },
    });
  }

  async isVerified(
    identityId: string,
    type: VerificationType
  ): Promise<boolean> {
    const record = await prisma.identityVerification.findFirst({
      where: {
        identityId,
        type,
        verifiedAt: { not: null },
      },
      select: { id: true }, // FAST: minimal select
    });

    return Boolean(record);
  }

  async markVerified(
    identityId: string,
    type: VerificationType
  ): Promise<void> {
    await prisma.identityVerification.updateMany({
      where: {
        identityId,
        type,
        verifiedAt: null,
      },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  /* ============================
     Optimized Composite Queries
  ============================ */

  async findForLogin(params: {
    email?: string;
    phone?: string;
  }): Promise<Identity | null> {
    if (params.email) {
      return this.findByEmail(params.email);
    }

    if (params.phone) {
      return this.findByPhone(params.phone);
    }

    return null;
  }

  async findIdentityWithVerifications(identityId: string) {
    return prisma.identity.findUnique({
      where: { id: identityId },
      include: {
        verifications: true,
      },
    });
  }

  /* ============================
     Safety / Constraints
  ============================ */

  async existsByEmail(email: string): Promise<boolean> {
    const record = await prisma.identity.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true },
    });

    return Boolean(record);
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const record = await prisma.identity.findUnique({
      where: { phone: normalizePhone(phone) },
      select: { id: true },
    });

    return Boolean(record);
  }
}
