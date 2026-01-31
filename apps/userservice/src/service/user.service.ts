import { UserRepository } from '../repositories';
import { logger } from '@hyperlocal/shared/logger';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import {
  CreateUserPayload,
  UpdateUserRepositoryPayload,
  UploadAvatarParams,
} from '../types';
import { UpdateUserProfilePayload } from '../validators';
import {
  uploadImage,
  extractPublicIdFromUrl,
  deleteImage,
  validateImageFile,
  optimizeImage,
} from '../utils';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
  ) {}

  async createUser(payload: CreateUserPayload) {
    try {
      const user = await this.userRepo.createUser(payload);

      logger.info('User created (idempotent)', {
        userId: user.id,
        authIdentityId: payload.authIdentityId,
        username: payload.username,
      });

      return user;
    } catch (error: unknown) {
     
        if (error?.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('username')) {
            throw new ConflictError('Username already taken');
          }
          if (target?.includes('email')) {
            throw new ConflictError('Email already in use');
          }
          if (target?.includes('phone')) {
            throw new ConflictError('Phone number already in use');
          }
        
      }
      throw error;
    }
  }

  async getUserByAuthIdentityId(authIdentityId?: string) {
    if (!authIdentityId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    const user = await this.userRepo.findByAuthIdentityId(authIdentityId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenError('User account is inactive or deleted');
    }

    return user;
  }

  async getUserById(userId: string, requestingAuthId?: string) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    if (!requestingAuthId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.authIdentityId !== requestingAuthId) {
      throw new ForbiddenError('Access denied');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenError('User account is inactive or deleted');
    }

    return user;
  }

  async updateUserProfile(
    userId: string,
    payload: UpdateUserProfilePayload,
    requestingAuthId?: string,
  ) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    if (!requestingAuthId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    if (!Object.keys(payload).length) {
      throw new BadRequestError('No fields provided to update');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.authIdentityId !== requestingAuthId) {
      throw new ForbiddenError('Access denied: Cannot update another user profile');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenError('User account is inactive or deleted');
    }

    const updateData: UpdateUserRepositoryPayload = {};

    if (payload.username !== undefined) {
      updateData.username = payload.username;
    }

    if (payload.firstName !== undefined) {
      updateData.firstName = payload.firstName;
    }

    if (payload.lastName !== undefined) {
      updateData.lastName = payload.lastName;
    }

    try {
      const updatedUser = await this.userRepo.updateProfile(userId, updateData);

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error: unknown) {
        if (error?.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('username')) {
            throw new ConflictError('Username already taken');
          }
        }
      
      throw error;
    }
  }

  async uploadUserAvatar(params: UploadAvatarParams) {
    const { userId, fileBuffer, requestingAuthId } = params;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    if (!requestingAuthId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError('Avatar image file is required');
    }

    const validation = await validateImageFile(fileBuffer);
    if (!validation.isValid) {
      throw new BadRequestError(validation.error || 'Invalid image file');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.authIdentityId !== requestingAuthId) {
      throw new ForbiddenError('Access denied: Cannot update another user avatar');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenError('User account is inactive or deleted');
    }

    let optimizedBuffer = fileBuffer;
    try {
      optimizedBuffer = await optimizeImage(fileBuffer);
    } catch (error: unknown) {
      logger.warn('Image optimization failed, using original', {
        error: error.message,
        userId,
      });
    }

    if (user.avatarUrl) {
      const oldPublicId = extractPublicIdFromUrl(user.avatarUrl);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
        } catch (error: unknown) {
          logger.warn('Failed to delete old avatar from Cloudinary', {
            error: error.message,
            publicId: oldPublicId,
          });
        }
      }
    }

    const uploadResult = await uploadImage(optimizedBuffer, {
      folder: 'avatars',
      userId,
    });

    const updatedUser = await this.userRepo.updateAvatar(userId, uploadResult.secureUrl);

    logger.info('User avatar updated', {
      userId,
    });

    return updatedUser;
  }

  async deleteUserAvatar(userId: string, requestingAuthId?: string) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    if (!requestingAuthId) {
      throw new BadRequestError('Auth identity ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.authIdentityId !== requestingAuthId) {
      throw new ForbiddenError('Access denied: Cannot delete another user avatar');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenError('User account is inactive or deleted');
    }

    if (user.avatarUrl) {
      const publicId = extractPublicIdFromUrl(user.avatarUrl);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (error: unknown) {
          logger.warn('Failed to delete avatar from Cloudinary', {
            error: error.message,
            publicId,
          });
        }
      }
    }

    const updatedUser = await this.userRepo.deleteAvatar(userId);

    logger.info('User avatar deleted', {
      userId,
    });

    return updatedUser;
  }
}
