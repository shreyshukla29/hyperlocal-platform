import type { ServicePersonStatus } from '../enums';

export interface ServicePersonProviderServiceRef {
  id: string;
  name: string;
  category: string | null;
}

export interface ServicePersonResponse {
  id: string;
  providerId: string;
  provider?: { id: string; businessName: string | null; firstName: string; lastName: string };
  name: string;
  phone: string;
  email: string | null;
  role: string | null;
  authIdentityId: string | null;
  status: ServicePersonStatus;
  isActive: boolean;
  providerServices?: ServicePersonProviderServiceRef[];
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServicePersonPayload {
  providerId: string;
  name: string;
  phone: string;
  email?: string | null;
  role?: string | null;
  providerServiceIds?: string[];
}

export interface UpdateServicePersonRepositoryPayload {
  name?: string;
  phone?: string;
  email?: string | null;
  role?: string | null;
  isActive?: boolean;
  providerServiceIds?: string[];
}

export interface UpdateServicePersonStatusPayload {
  status: ServicePersonStatus;
}

export interface ListServicePeopleQuery {
  status?: ServicePersonStatus;
  isActive?: boolean;
  /** Filter by type of service (providerServiceId); returns only service people qualified for this service */
  providerServiceId?: string;
}
