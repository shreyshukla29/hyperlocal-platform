import { prisma as defaultPrisma } from '../config/index.js';
import { User } from '../generated/prisma/client.js';
import { CreateUserPayload, UpdateUserRepositoryPayload } from '../types/index.js';

export class UserRepository {
   constructor(private prisma = defaultPrisma) {}
  async createUser(payload: CreateUserPayload): Promise<User> {
    const {
      authIdentityId,
      firstName,
      lastName = null,
      email = null,
      phone = null,
      username = null,
    } = payload;

    return this.prisma.user.upsert({
      where: {
        authIdentityId,
      },
      update: {},
      create: {
        authIdentityId,
        firstName,
        lastName,
        email,
        phone,
        username,
      },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findByAuthIdentityId(authIdentityId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { authIdentityId },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return user !== null;
  }

  async updateProfile(
    userId: string,
    payload: UpdateUserRepositoryPayload,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...payload,
        updatedAt: new Date(),
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        updatedAt: new Date(),
      },
    });
  }

  async deleteAvatar(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        updatedAt: new Date(),
      },
    });
  }
}
