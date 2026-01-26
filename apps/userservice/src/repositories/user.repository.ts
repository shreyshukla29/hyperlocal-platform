import { prisma } from '../config';
import { User } from '../generated/prisma/client';



export interface CreateUserPayload {
  authIdentityId: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}



export class UserRepository {

  async createUser(payload: CreateUserPayload): Promise<User> {
    const {
      authIdentityId,
      firstName,
      lastName = null,
      email = null,
      phone = null,
    } = payload;

    return prisma.user.upsert({
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
      },
    });
  }


  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }



  async findByAuthIdentityId(authIdentityId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { authIdentityId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }


  async updateProfile(
    userId: string,
    payload: Upd,
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...payload,
      },
    });
  }

 
  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
      },
    });
  }

 
  async deleteAvatar(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
      },
    });
  }


  async findPublicProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }
}
