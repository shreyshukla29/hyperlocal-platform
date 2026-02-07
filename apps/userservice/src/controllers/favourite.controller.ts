import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FavouriteService } from '../service/favourite.service.js';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';

export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  async add(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const providerId = req.body?.providerId ?? req.params?.providerId;
      if (!userAuthId || !providerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and providerId are required' },
        });
      }
      const data = await this.favouriteService.add(userAuthId, providerId);
      return res.status(StatusCodes.CREATED).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

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
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await this.favouriteService.list(userAuthId, { page, limit });
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { providerId } = req.params;
      if (!userAuthId || !providerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and providerId are required' },
        });
      }
      const removed = await this.favouriteService.remove(userAuthId, providerId);
      return res.status(removed ? StatusCodes.NO_CONTENT : StatusCodes.NOT_FOUND).send();
    } catch (error) {
      next(error);
    }
  }
}
