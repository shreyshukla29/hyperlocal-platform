import { VerificationType } from '../generated/prisma/client.js';
import { AccountType, AuthMethod } from '../enums/index.js';

export interface CreateIdentityInput {
  email?: string;
  phone?: string;
  password: string;
  accountType: AccountType;
}

export interface LoginWithEmailRequest {
  method: AuthMethod;
  email?: string;
  password?: string;
  loginAs?: AccountType;
}

export interface LoginWithPhoneRequest {
  method: AuthMethod;
  phone?: string;
  password?: string;
  loginAs?: AccountType;
}

export interface SignupRequest {
  email?: string;
  phone?: string;
  password: string;
  accountType: AccountType;
  firstName: string;
  lastName: string;
}

interface SignupResponseData {
  authId: string;
  email?: string | null;
  phone?: string | null;
  accountType: AccountType;
}

export interface SignupResponse {
  data: SignupResponseData;
  token: string;
  refreshToken?: string;
}

export interface LoginResponseData {
  authId: string;
  email?: string | null;
  phone?: string | null;
  accountType: AccountType;
}
export interface LoginResponse {
  data: LoginResponseData;
  token: string;
  refreshToken?: string;
}

export interface LoginLookupInput {
  email?: string;
  phone?: string;
  accountType: AccountType;
}

export interface AuthTokenPayload {
  authId: string;
  email?: string;
  phone?: string;
  accountType: string;
}

export interface SendVerificationRequest {
  identityId: string;
  type: 'EMAIL' | 'PHONE';
  value: string;
}

export interface VerifyRequest {
  identityId: string;
  type: 'EMAIL' | 'PHONE';
  value: string;
  code: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  data: LoginResponseData;
  token: string;
  refreshToken: string;
}

export { VerificationType };
