import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BookingService, BookingReviewService } from '../service/index.js';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import {
  listBookingsQuerySchema,
  assignServicePersonSchema,
  confirmArrivalSchema,
  verifyCompletionSchema,
  availableSlotsQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
} from '../validators/index.js';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly reviewService: BookingReviewService,
  ) {}

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

  async assignServicePerson(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const providerId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      const parsed = assignServicePersonSchema.safeParse(req.body);
      if (!providerId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Provider ID and booking ID are required' },
        });
      }
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid body' },
        });
      }
      const data = await this.bookingService.assignServicePerson(
        bookingId,
        providerId,
        parsed.data.assignedServicePersonId,
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

  async confirmArrival(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const providerId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      const parsed = confirmArrivalSchema.safeParse(req.body);
      if (!providerId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Provider ID and booking ID are required' },
        });
      }
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid body' },
        });
      }
      const data = await this.bookingService.confirmArrival(
        bookingId,
        providerId,
        parsed.data.otp,
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

  async markComplete(
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
      const data = await this.bookingService.markComplete(bookingId, providerId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyCompletion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      const parsed = verifyCompletionSchema.safeParse(req.body);
      if (!userAuthId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and booking ID are required' },
        });
      }
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid body' },
        });
      }
      const data = await this.bookingService.verifyCompletion(
        bookingId,
        userAuthId,
        parsed.data.otp,
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

  async getAvailableSlots(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const parsed = availableSlotsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid query' },
        });
      }
      const data = await this.bookingService.getAvailableSlots(
        parsed.data.providerId,
        parsed.data.date,
        parsed.data.slotDurationMinutes,
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

  async createReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userAuthId = getAuthIdentityIdFromRequest(req.headers);
      const { id: bookingId } = req.params;
      const parsed = createReviewSchema.safeParse(req.body);
      if (!userAuthId || !bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: 'Auth identity ID and booking ID are required' },
        });
      }
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid body' },
        });
      }
      const data = await this.reviewService.create(
        bookingId,
        userAuthId,
        parsed.data,
      );
      return res.status(StatusCodes.CREATED).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listReviewsByProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const parsed = listReviewsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          data: null,
          error: { message: parsed.error.message ?? 'Invalid query' },
        });
      }
      const data = await this.reviewService.listByProvider(
        parsed.data.providerId,
        {
          providerServiceId: parsed.data.providerServiceId,
          page: parsed.data.page,
          limit: parsed.data.limit,
        },
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
