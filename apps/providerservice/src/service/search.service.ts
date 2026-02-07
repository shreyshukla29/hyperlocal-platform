import { SearchRepository } from '../repositories/search.repository.js';
import type {
  SearchQuery,
  TopServicesQuery,
  SearchServiceItem,
  PaginatedSearchResult,
} from '../types/search.types.js';

export class SearchService {
  constructor(private readonly searchRepo: SearchRepository) {}

  async searchServices(
    query: SearchQuery,
  ): Promise<PaginatedSearchResult<SearchServiceItem>> {
    return this.searchRepo.searchServices(query);
  }

  async getTopServices(
    query: TopServicesQuery,
  ): Promise<PaginatedSearchResult<SearchServiceItem>> {
    return this.searchRepo.getTopServices(query);
  }
}
