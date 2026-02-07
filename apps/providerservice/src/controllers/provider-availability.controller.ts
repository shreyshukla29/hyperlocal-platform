import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProviderAvailabilityService } from '../service/provider-availability.service.js';

export class ProviderAvailabilityController {
  constructor(private readonly availabilityService: ProviderAvailabilityService) {}

  async getOpenIntervals(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { providerId } = req.params;
      const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
      if (!providerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'providerId is required' },
        });
      }
      const data = await this.availabilityService.getOpenIntervalsForDate(
        providerId,
        date,
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
