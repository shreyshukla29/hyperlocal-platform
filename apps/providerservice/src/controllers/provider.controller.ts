import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProviderService } from '../service';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import {
  UpdateProviderProfilePayload,
  topProvidersByLocationQuerySchema,
} from '../validators';

export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  async getProviderProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const provider = await this.providerService.getProviderByAuthIdentityId(
        authIdentityId,
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data: provider,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopProvidersByLocation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const parsed = topProvidersByLocationQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.providerService.getTopProvidersByLocation(
        query ?? {},
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

  async updateProviderProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id: providerId } = req.params;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const payload = req.body as UpdateProviderProfilePayload;

      const provider = await this.providerService.updateProviderProfile(
        providerId,
        payload,
        authIdentityId,
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: provider,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
