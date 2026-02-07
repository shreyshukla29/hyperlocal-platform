import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../service/index.js';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { listNotificationsQuerySchema } from '../validators/index.js';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async list(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      if (!userAuthId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID is required' },
        });
      }
      const parsed = listNotificationsQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.notificationService.listByUser(userAuthId, query);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id } = req.params;
      if (!userAuthId || !id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and notification ID are required' },
        });
      }
      const data = await this.notificationService.getById(id, userAuthId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id } = req.params;
      if (!userAuthId || !id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and notification ID are required' },
        });
      }
      const data = await this.notificationService.markAsRead(id, userAuthId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      if (!userAuthId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID is required' },
        });
      }
      const data = await this.notificationService.markAllAsRead(userAuthId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
