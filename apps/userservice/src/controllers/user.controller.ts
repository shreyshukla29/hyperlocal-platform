import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../service';
import { UpdateUserProfilePayload } from '../validators';
import {
  uploadImage,
  extractPublicIdFromUrl,
  deleteImage,
} from '../utils';
import { validateImageFile, optimizeImage } from '../utils';
import { logger } from '@hyperlocal/shared/logger';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = req.headers['x-user-id'] as string | undefined;

      if (!authIdentityId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID is required',
          data: null,
        });
      }

      const user = await this.userService.getUserByAuthIdentityId(
        authIdentityId,
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id: userId } = req.params;
      const authIdentityId = req.headers['x-user-id'] as string | undefined;
      const payload = req.body as UpdateUserProfilePayload;

      if (!authIdentityId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID is required',
          data: null,
        });
      }

      const user = await this.userService.updateUserProfile(
        userId,
        payload,
        authIdentityId,
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadUserAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id: userId } = req.params;
      const authIdentityId = req.headers['x-user-id'] as string | undefined;

      if (!authIdentityId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID is required',
          data: null,
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Avatar image file is required',
          data: null,
        });
      }

      const validation = await validateImageFile(file.buffer);
      if (!validation.isValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'BAD_REQUEST',
          message: validation.error || 'Invalid image file',
          data: null,
        });
      }

      const existingUser = await this.userService.getUserById(
        userId,
        authIdentityId,
      );

      let optimizedBuffer = file.buffer;
      try {
        optimizedBuffer = await optimizeImage(file.buffer);
      } catch (error: any) {
        logger.warn('Image optimization failed, using original', {
          error: error.message,
          userId,
        });
      }

      if (existingUser.avatarUrl) {
        const oldPublicId = extractPublicIdFromUrl(existingUser.avatarUrl);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
          } catch (error: any) {
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

      const user = await this.userService.updateUserAvatar(
        userId,
        uploadResult.secureUrl,
        authIdentityId,
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUserAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id: userId } = req.params;
      const authIdentityId = req.headers['x-user-id'] as string | undefined;

      if (!authIdentityId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID is required',
          data: null,
        });
      }

      const existingUser = await this.userService.getUserById(
        userId,
        authIdentityId,
      );

      if (existingUser.avatarUrl) {
        const publicId = extractPublicIdFromUrl(existingUser.avatarUrl);
        if (publicId) {
          try {
            await deleteImage(publicId);
          } catch (error: any) {
            logger.warn('Failed to delete avatar from Cloudinary', {
              error: error.message,
              publicId,
            });
          }
        }
      }

      const user = await this.userService.deleteUserAvatar(
        userId,
        authIdentityId,
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
