import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ServicePersonService } from '../service/service-person.service';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { listServicePeopleQuerySchema } from '../validators';

export class ServicePersonController {
  constructor(private readonly servicePersonService: ServicePersonService) {}

  /** Only the provider (owner) can create service people; caller must be the provider from JWT. */
  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      if (!authIdentityId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID is required' },
        });
      }
      // Body must not contain providerId – service always uses provider resolved from JWT
      const payload = req.body;
      const data = await this.servicePersonService.create(authIdentityId, payload);
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
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      if (!authIdentityId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID is required' },
        });
      }
      const parsed = listServicePeopleQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.servicePersonService.list(authIdentityId, query);
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
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const { id: servicePersonId } = req.params;
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.getById(
        servicePersonId,
        authIdentityId,
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const { id: servicePersonId } = req.params;
      const payload = req.body;
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.update(
        servicePersonId,
        authIdentityId,
        payload,
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const { id: servicePersonId } = req.params;
      const payload = req.body as { status: string };
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.updateStatus(
        servicePersonId,
        authIdentityId,
        payload,
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const { id: servicePersonId } = req.params;
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.deactivate(
        servicePersonId,
        authIdentityId,
      );
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
