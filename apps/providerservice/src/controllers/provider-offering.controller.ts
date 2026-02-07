import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProviderOfferingService } from '../service/provider-offering.service.js';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { listProviderOfferingsQuerySchema } from '../validators/provider-offering.schema.js';

export class ProviderOfferingController {
  constructor(private readonly offeringService: ProviderOfferingService) {}

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
      const payload = req.body;
      const data = await this.offeringService.create(authIdentityId, payload);
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
      const parsed = listProviderOfferingsQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.offeringService.list(authIdentityId, query);
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
      const { id: offeringId } = req.params;
      if (!authIdentityId || !offeringId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service offering ID are required' },
        });
      }
      const data = await this.offeringService.getById(authIdentityId, offeringId);
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
      const { id: offeringId } = req.params;
      const payload = req.body;
      if (!authIdentityId || !offeringId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service offering ID are required' },
        });
      }
      const data = await this.offeringService.update(
        authIdentityId,
        offeringId,
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

  async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const { id: offeringId } = req.params;
      if (!authIdentityId || !offeringId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and service offering ID are required' },
        });
      }
      await this.offeringService.delete(authIdentityId, offeringId);
      return res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  /** Booking quote: price from backend only (called by Booking service or gateway). No auth required. */
  async getBookingQuote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { providerId, providerServiceId } = req.params;
      if (!providerId || !providerServiceId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'providerId and providerServiceId are required' },
        });
      }
      const data = await this.offeringService.getBookingQuote(
        providerId,
        providerServiceId,
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
