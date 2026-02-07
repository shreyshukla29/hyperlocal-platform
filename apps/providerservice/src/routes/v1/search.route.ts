import { Router } from 'express';
import { SearchController } from '../../controllers/search.controller.js';
import { SearchService } from '../../service/search.service.js';
import { SearchRepository } from '../../repositories/search.repository.js';

const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

export const searchRouter = Router();

searchRouter.get('/', searchController.search.bind(searchController));
searchRouter.get('/top-services', searchController.getTopServices.bind(searchController));
