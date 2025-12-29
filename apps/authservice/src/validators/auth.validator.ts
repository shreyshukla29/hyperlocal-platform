import { z } from 'zod';
import { AccountType, AuthMethod } from '../enums';


export const signupSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z
      .string()
      .min(8, 'Phone number is too short')
      .max(15, 'Phone number is too long')
      .optional(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),

    accountType: z.nativeEnum(AccountType),
  })
  .refine(
    (data) => Boolean(data.email || data.phone),
    {
      message: 'Either email or phone is required',
      path: ['email'],
    },
  );


export const loginWithEmailSchema = z.object({
  method: z.literal(AuthMethod.EMAIL),

  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),

  loginAs: z.nativeEnum(AccountType),
});


export const loginWithPhoneSchema = z.object({
  method: z.literal(AuthMethod.PHONE),

  phone: z
    .string()
    .min(8, 'Phone number is too short')
    .max(15, 'Phone number is too long'),

  password: z.string().min(1, 'Password is required'),

  loginAs: z.nativeEnum(AccountType),
});
