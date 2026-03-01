import { Router } from 'express';
import { validateQuery } from '@hyperlocal/shared/middlewares';
import { SearchController } from '../../controllers/search.controller.js';
import { SearchService } from '../../service/search.service.js';
import { SearchRepository } from '../../repositories/search.repository.js';
import { searchQuerySchema, topServicesQuerySchema } from '../../validators/search.schema.js';

const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

export const searchRouter = Router();

searchRouter.get(
  '/',
  validateQuery(searchQuerySchema),
  searchController.search.bind(searchController),
);
searchRouter.get(
  '/top-services',
  validateQuery(topServicesQuerySchema),
  searchController.getTopServices.bind(searchController),
);
