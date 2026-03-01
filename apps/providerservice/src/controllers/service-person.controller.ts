import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getRequestParam, getAuthIdentityIdFromRequest } from '@hyperlocal/shared';
import { ServicePersonService } from '../service/service-person.service.js';
import { listServicePeopleQuerySchema } from '../validators/index.js';
import type { UpdateServicePersonStatusPayload } from '../validators/index.js';
import { updateServicePersonStatusSchema } from '../validators/index.js';

export class ServicePersonController {
  constructor(private readonly servicePersonService: ServicePersonService) {}

  /** Only the provider (owner) can create service people; caller must be the provider from JWT. */
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

  async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      if (!authIdentityId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID is required' },
        });
      }
      const query = listServicePeopleQuerySchema.parse(req.query);
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const servicePersonId = getRequestParam(req, 'id');
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.getById(servicePersonId, authIdentityId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const servicePersonId = getRequestParam(req, 'id');
      const payload = req.body;
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.update(servicePersonId, authIdentityId, payload);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const servicePersonId = getRequestParam(req, 'id');
      const parsed = updateServicePersonStatusSchema.safeParse(req.body);
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid body' },
        });
      }
      const data = await this.servicePersonService.updateStatus(
        servicePersonId,
        authIdentityId,
        parsed.data,
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

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const servicePersonId = getRequestParam(req, 'id');
      if (!authIdentityId || !servicePersonId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service person ID are required' },
        });
      }
      const data = await this.servicePersonService.deactivate(servicePersonId, authIdentityId);
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
