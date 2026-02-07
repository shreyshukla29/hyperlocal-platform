import { z } from 'zod';
import { AccountType, AuthMethod } from '../enums/index.js';

export const signupSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z
      .string()
      .min(10, 'Phone number is too short')
      .max(10, 'Phone number is too long')
      .optional(),

    password: z.string().min(8, 'Password must be at least 8 characters').max(128),

    accountType: z.nativeEnum(AccountType),
    firstName:z.string(),
    lastName: z.string(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Either email or phone is required',
    path: ['email'],
  });

export const loginWithEmailSchema = z.object({
  method: z.literal(AuthMethod.EMAIL),

  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),

  loginAs: z.nativeEnum(AccountType),
});

export const loginWithPhoneSchema = z.object({
  method: z.literal(AuthMethod.PHONE),

  phone: z.string().min(8, 'Phone number is too short').max(15, 'Phone number is too long'),

  password: z.string().min(1, 'Password is required'),

  loginAs: z.nativeEnum(AccountType),
});

export const sendVerificationSchema = z
  .object({
    type: z.enum([AuthMethod.EMAIL, AuthMethod.PHONE]),
    value: z.string().min(1, 'Value is required'),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === AuthMethod.EMAIL) {
        return z.string().email().safeParse(data.value).success;
      }
      return data.value.length >= 8 && data.value.length <= 15;
    },
    {
      message: 'Invalid email or phone format',
      path: ['value'],
    },
  );

export const verifySchema = z
  .object({
    type: z.enum([AuthMethod.EMAIL, AuthMethod.PHONE]),
    value: z.string().min(1, 'Value is required'),
    code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be 6 digits'),
  })
  .strict();
