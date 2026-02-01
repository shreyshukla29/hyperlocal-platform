import type { ProviderServiceStatus } from '../enums';

export interface ProviderOfferingResponse {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  durationMinutes: number | null;
  status: ProviderServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProviderOfferingPayload {
  providerId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  durationMinutes?: number | null;
  status?: ProviderServiceStatus;
}

export interface UpdateProviderOfferingRepositoryPayload {
  name?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  durationMinutes?: number | null;
  status?: ProviderServiceStatus;
}

export interface ListProviderOfferingsQuery {
  page?: number;
  limit?: number;
  status?: ProviderServiceStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
