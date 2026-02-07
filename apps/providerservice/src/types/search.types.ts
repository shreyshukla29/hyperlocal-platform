export interface SearchServiceItem {
  id: string;
  providerId: string;
  providerBusinessName: string | null;
  providerCity: string | null;
  providerVerificationStatus: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  durationMinutes: number | null;
  status: string;
  createdAt: Date;
}

export interface SearchQuery {
  q?: string;
  category?: string;
  city?: string;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface TopServicesQuery {
  city?: string;
  latitude?: number;
  longitude?: number;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
