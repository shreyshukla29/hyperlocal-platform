import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';


import { UserService } from '../services/user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      console.log(req)
      const  authIdentityId= req.headers['x-user-id'] as string | undefined;

      const user = await this.userService.getUserById(authIdentityId);

      return res.status(StatusCodes.OK).json({
        data: user,
      });
    } catch (error) {
   
      next(error);
    }
  }


  async updateUserProfile(req, res, next) {
  try {
    const { id: userId } = req.params;

    const user = await this.userService.updateUserProfile(
      userId,
      req.body,
    );

    return res.status(200).json({ data: user });
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
      const { avatarUrl } = req.body;

      const user = await this.userService.updateUserAvatar(
        userId,
        avatarUrl,
      );

      return res.status(StatusCodes.OK).json({
        data: user,
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

      const user = await this.userService.deleteUserAvatar(userId);

      return res.status(StatusCodes.OK).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
