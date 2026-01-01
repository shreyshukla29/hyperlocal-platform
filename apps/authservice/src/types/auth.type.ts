import { VerificationType } from '../generated/prisma/client';
import { AccountType, AuthMethod } from '../enums';

export interface CreateIdentityInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  accountTypes: string[];
}

export interface LoginWithEmailRequest {
  method : AuthMethod,
  email?: string;
  password?: string;
  loginAs? : AccountType
}

export interface LoginWithPhoneRequest {
   method : AuthMethod,
phone?: string,
password?:string,
loginAs?: AccountType
}

export interface SignupRequest {
  email?: string;
  phone?: string;
  password: string;
  accountTypes: AccountType;
}


export interface SignupResponse {
 email?: string;
  phone?: string;
  password: string;
  accountTypes: AccountType;
  token: string
}

export interface LoginResponse {
   userId: string,
   accountType: AccountType,
    token: string
}

export interface AuthTokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  accountType: string;
}


export { VerificationType };
