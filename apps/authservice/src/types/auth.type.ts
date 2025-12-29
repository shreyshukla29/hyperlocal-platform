import { VerificationType } from '../generated/prisma/client';

export interface CreateIdentityInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  accountTypes: string[];
}

export interface LoginLookupInput {
  email?: string;
  phone?: string;
}

export interface SignupRequest {

  email? : string
  phone? : string
  password: string
  accountTypes : Jso

}
}

export { VerificationType };
