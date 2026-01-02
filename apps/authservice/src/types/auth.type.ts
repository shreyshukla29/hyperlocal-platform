import { VerificationType } from '../generated/prisma/client';
import { AccountType, AuthMethod } from '../enums';
import { AccountType } from './../generated/prisma/enums';

export interface CreateIdentityInput {
  email?: string;
  phone?: string;
  password: string;
  accountType: AccountType;
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
  accountType: AccountType;
  firstName: string;
  lastName: string;
}


interface SignupResponseData {
  email?: string;
  phone?: string;
  password: string;
  accountTypes: AccountType;
}

export interface SignupResponse {
 data : SignupResponseData,
  token: string
}

interface LoginResponseData{
  userId: string,
   accountType: AccountType,
}
export interface LoginResponse {
 data :LoginResponseData,
    token: string
}

export interface AuthTokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  accountType: string;
}


export { VerificationType };
