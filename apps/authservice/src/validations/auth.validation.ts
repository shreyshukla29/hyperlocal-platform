import { z } from 'zod';
import { AuthMethod, AccountType } from '../enums'


export const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8),
  accountType: z.nativeEnum(AccountType),
}).refine(
  data => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email'],
  }
);

export const loginSchema = z.object({
  method: z.nativeEnum(AuthMethod),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string(),
  loginAs: z.nativeEnum(AccountType),
}).superRefine((data, ctx) => {
  if (data.method === AuthMethod.EMAIL && !data.email) {
    ctx.addIssue({
      path: ['email'],
      message: 'Email is required for email login',
      code: z.ZodIssueCode.custom,
    });
  }

  if (data.method === AuthMethod.PHONE && !data.phone) {
    ctx.addIssue({
      path: ['phone'],
      message: 'Phone is required for phone login',
      code: z.ZodIssueCode.custom,
    });
  }
});
