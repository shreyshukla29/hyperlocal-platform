import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SearchService } from '../service/search.service.js';
import { searchQuerySchema, topServicesQuerySchema } from '../validators/search.schema.js';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  async search(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const query = searchQuerySchema.parse(req.query);
      const data = await this.searchService.searchServices(query);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopServices(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const query = topServicesQuerySchema.parse(req.query);
      const data = await this.searchService.getTopServices(query);
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
