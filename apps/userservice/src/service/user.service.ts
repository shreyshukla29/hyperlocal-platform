import { UserRepository } from '../repositories';
import { logger } from '@hyperlocal/shared/logger';
import {
  NotFoundError,
  BadRequestError,
} from '@hyperlocal/shared/errors';

import {
  UpdateUserProfilePayload,
  CreateUserPayload,
} from '../repositories';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
  ) {}


  async createUser(payload: CreateUserPayload) {
    const user = await this.userRepo.createUser(payload);

    logger.info('User created (idempotent)', {
      userId: user.id,
      authIdentityId: payload.authIdentityId,
    });

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async getUserByAuthIdentityId(authIdentityId: string) {
    const user = await this.userRepo.findByAuthIdentityId(authIdentityId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async getUserByPhone(phone: string) {
    const user = await this.userRepo.findByPhone(phone);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }



  async updateUserProfile(
    userId: string,
    payload: UpdateUserProfilePayload,
  ) {
    if (!Object.keys(payload).length) {
      throw new BadRequestError('No fields provided to update');
    }

    const updatedUser = await this.userRepo.updateProfile(
      userId,
      payload,
    );

    logger.info('User profile updated', {
      userId,
      updatedFields: Object.keys(payload),
    });

    return updatedUser;
  }



  async updateUserAvatar(userId: string, avatarUrl: string) {
    if (!avatarUrl) {
      throw new BadRequestError('Avatar URL is required');
    }

    const user = await this.userRepo.updateAvatar(userId, avatarUrl);

    logger.info('User avatar updated', {
      userId,
    });

    return user;
  }

  async deleteUserAvatar(userId: string) {
    const user = await this.userRepo.deleteAvatar(userId);

    logger.info('User avatar deleted', {
      userId,
    });

    return user;
  }
}
