import { prisma } from '../database/prisma';
import {
  Identity,
  IdentityVerification,
  VerificationType,
} from '../generated/prisma/client';

import {
  CreateIdentityInput,
  LoginLookupInput,
} from '../types/auth.types';

import {
  normalizeEmail,
  normalizePhone,
} from '../utils/normalization';

export class AuthRepository {


  async createIdentity(input: CreateIdentityInput): Promise<Identity> {
    return prisma.identity.create({
      data: {
        email: input.email ? normalizeEmail(input.email) : null,
        phone: input.phone ? normalizePhone(input.phone) : null,
        passwordHash: input.passwordHash,
        accountTypes: input.accountTypes,
      },
    });
  }

  async findById(identityId: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: { id: identityId },
    });
  }

  async findByEmail(email: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: { email: normalizeEmail(email) },
    });
  }

  async findByPhone(phone: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: { phone: normalizePhone(phone) },
    });
  }

 
  async findForLogin(input: LoginLookupInput): Promise<Identity | null> {
    if (input.email) {
      return this.findByEmail(input.email);
    }

    if (input.phone) {
      return this.findByPhone(input.phone);
    }

    return null;
  }



  async deactivateIdentity(identityId: string): Promise<void> {
    await prisma.identity.update({
      where: { id: identityId },
      data: { isActive: false },
    });
  }

  async activateIdentity(identityId: string): Promise<void> {
    await prisma.identity.update({
      where: { id: identityId },
      data: { isActive: true },
    });
  }

  async updateAccountTypes(
    identityId: string,
    accountTypes: string[]
  ): Promise<void> {
    await prisma.identity.update({
      where: { id: identityId },
      data: { accountTypes },
    });
  }

  /* ======================================================
     VERIFICATION – CREATION & CHECKS
  ====================================================== */

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

  /**
   * FAST verification check
   * Minimal select, index-friendly
   */
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
      select: { id: true },
    });

    return Boolean(record);
  }

  /**
   * Idempotent verification update
   * Safe for retries
   */
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

  /* ======================================================
     SAFETY / PRE-CONSTRAINT CHECKS
  ====================================================== */

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

  /* ======================================================
     RARE / ADMIN READS
  ====================================================== */

  async getIdentityWithVerifications(identityId: string) {
    return prisma.identity.findUnique({
      where: { id: identityId },
      include: {
        verifications: true,
      },
    });
  }
}
