import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BookingService } from '../service';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { listBookingsQuerySchema } from '../validators';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  async create(
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
      const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER];
      const key = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey;
      const payload = req.body;
      const result = await this.bookingService.create(
        userAuthId,
        payload,
        typeof key === 'string' ? key : undefined,
      );
      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listForUser(
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
      const parsed = listBookingsQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.bookingService.listByUser(userAuthId, query);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listForProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const providerId = getAuthIdentityIdFromRequest(req.headers);
      if (!providerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Provider ID (auth identity) is required' },
        });
      }
      const parsed = listBookingsQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : undefined;
      const data = await this.bookingService.listByProvider(providerId, query);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdForUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      if (!userAuthId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and booking ID are required' },
        });
      }
      const data = await this.bookingService.getByIdForUser(bookingId, userAuthId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdForProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const providerId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      if (!providerId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Provider ID and booking ID are required' },
        });
      }
      const data = await this.bookingService.getByIdForProvider(bookingId, providerId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelByUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      if (!userAuthId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and booking ID are required' },
        });
      }
      const data = await this.bookingService.cancelByUser(bookingId, userAuthId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelByProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const providerId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      if (!providerId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Provider ID and booking ID are required' },
        });
      }
      const data = await this.bookingService.cancelByProvider(bookingId, providerId);
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
