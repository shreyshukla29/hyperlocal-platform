import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../service';
import { UpdateUserProfilePayload } from '../validators';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = req.headers['x-user-id'] as string | undefined;

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
      const file = req.file;

      const user = await this.userService.uploadUserAvatar({
        userId,
        fileBuffer: file?.buffer,
        requestingAuthId: authIdentityId,
      });

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
