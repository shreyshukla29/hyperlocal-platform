import { prisma } from '../config';
import {
  Identity,
  IdentityVerification,
  VerificationType,
  AccountType,
} from '../generated/prisma/client';

import { CreateIdentityInput, LoginLookupInput } from '../types/auth.types';
import { normalizeEmail, normalizePhone } from '../utils';

export class AuthRepository {


  async createIdentity(input: CreateIdentityInput): Promise<Identity> {
    return prisma.identity.create({
      data: {
        email: input.email ? normalizeEmail(input.email) : null,
        phone: input.phone ? normalizePhone(input.phone) : null,
        password: input.password,
        accountType: input.accountType,
      },
    });
  }



  async findById(identityId: string): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: { id: identityId },
    });
  }

  async findByEmail(
    email: string,
    accountType: AccountType,
  ): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: {
        email_accountType: {
          email: normalizeEmail(email),
          accountType,
        },
      },
    });
  }

  async findByPhone(
    phone: string,
    accountType: AccountType,
  ): Promise<Identity | null> {
    return prisma.identity.findUnique({
      where: {
        phone_accountType: {
          phone: normalizePhone(phone),
          accountType,
        },
      },
    });
  }



  async findForLogin(input: LoginLookupInput): Promise<Identity | null> {
    const { email, phone, accountType } = input;

    if (!accountType) {
      throw new Error('accountType is required for login');
    }

    if (email) {
      return this.findByEmail(email, accountType);
    }

    if (phone) {
      return this.findByPhone(phone, accountType);
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



  async createVerification(
    identityId: string,
    type: VerificationType,
    value: string,
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
    type: VerificationType,
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

  async markVerified(
    identityId: string,
    type: VerificationType,
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


  async existsByEmail(
    email: string,
    accountType: AccountType,
  ): Promise<boolean> {
    const record = await prisma.identity.findUnique({
      where: {
        email_accountType: {
          email: normalizeEmail(email),
          accountType,
        },
      },
      select: { id: true },
    });

    return Boolean(record);
  }

  async existsByPhone(
    phone: string,
    accountType: AccountType,
  ): Promise<boolean> {
    const record = await prisma.identity.findUnique({
      where: {
        phone_accountType: {
          phone: normalizePhone(phone),
          accountType,
        },
      },
      select: { id: true },
    });

    return Boolean(record);
  }



  async getIdentityWithVerifications(identityId: string) {
    return prisma.identity.findUnique({
      where: { id: identityId },
      include: {
        verifications: true,
      },
    });
  }
}
