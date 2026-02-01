import { Prisma } from '../generated/prisma/client';
import { prisma as defaultPrisma } from '../config';
import type { CreateAddressData, UpdateAddressRepositoryPayload } from '../types';

export class AddressRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(userId: string, data: CreateAddressData) {
    return this.prisma.address.create({
      data: {
        userId,
        label: data.label ?? null,
        addressLine1: data.addressLine1 ?? null,
        addressLine2: data.addressLine2 ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        postalCode: data.postalCode ?? null,
        country: data.country ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        isDefault: data.isDefault,
        isActive: true,
      },
    });
  }

  async findById(addressId: string) {
    return this.prisma.address.findUnique({
      where: { id: addressId },
    });
  }

  async findByIdWithUser(addressId: string) {
    return this.prisma.address.findUnique({
      where: { id: addressId },
      select: {
        id: true,
        userId: true,
        label: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            authIdentityId: true,
            isActive: true,
            isDeleted: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultByUserId(userId: string) {
    return this.prisma.address.findFirst({
      where: { userId, isDefault: true, isActive: true },
    });
  }

  async update(addressId: string, payload: UpdateAddressRepositoryPayload) {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { ...payload, updatedAt: new Date() },
    });
  }

  async unsetDefaultForUser(userId: string) {
    await this.prisma.address.updateMany({
      where: { userId, isActive: true },
      data: { isDefault: false, updatedAt: new Date() },
    });
  }

  async setAsDefault(addressId: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.address.updateMany({
        where: { userId, isActive: true },
        data: { isDefault: false, updatedAt: new Date() },
      });
      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true, updatedAt: new Date() },
      });
    });
  }

  async softDelete(addressId: string) {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isActive: false, isDefault: false, updatedAt: new Date() },
    });
  }
}
