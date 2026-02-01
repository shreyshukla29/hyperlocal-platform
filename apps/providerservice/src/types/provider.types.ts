import type {
  VerificationStatus,
  AvailabilityStatus,
} from '../enums';

export interface ProviderResponse {
  id: string;
  authIdentityId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  businessName: string | null;
  businessAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  businessLicenseUrl: string | null;
  availabilityStatus: AvailabilityStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopProviderListItem {
  id: string;
  businessName: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  createdAt: Date;
}

export interface TopProvidersByLocationQuery {
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedProvidersResult {
  items: TopProviderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProviderPayload {
  authIdentityId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateProviderRepositoryPayload {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  availabilityStatus?: AvailabilityStatus;
  isActive?: boolean;
}

export interface GetProviderProfileParams {
  authIdentityId: string;
}

export interface UpdateProviderProfileParams {
  providerId: string;
  payload: UpdateProviderRepositoryPayload;
  requestingAuthId: string;
}
