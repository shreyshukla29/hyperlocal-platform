import { UserRepository } from '../repositories/user.repository.js';
import { FavouriteRepository } from '../repositories/favourite.repository.js';
import type { FavouriteResponse } from '../repositories/favourite.repository.js';
import { NotFoundError, ConflictError } from '@hyperlocal/shared/errors';

export class FavouriteService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly favouriteRepo: FavouriteRepository,
  ) {}

  async add(userAuthId: string, providerId: string): Promise<FavouriteResponse> {
    const user = await this.userRepo.findByAuthIdentityId(userAuthId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const existing = await this.favouriteRepo.findByUserAndProvider(user.id, providerId);
    if (existing) {
      throw new ConflictError('Provider already in favourites');
    }
    return this.favouriteRepo.create(user.id, providerId);
  }

  async list(
    userAuthId: string,
    query?: { page?: number; limit?: number },
  ): Promise<{ items: FavouriteResponse[]; total: number; page: number; limit: number; totalPages: number }> {
    const user = await this.userRepo.findByAuthIdentityId(userAuthId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.favouriteRepo.listByUserId(user.id, query);
  }

  async remove(userAuthId: string, providerId: string): Promise<boolean> {
    const user = await this.userRepo.findByAuthIdentityId(userAuthId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.favouriteRepo.delete(user.id, providerId);
  }
}
