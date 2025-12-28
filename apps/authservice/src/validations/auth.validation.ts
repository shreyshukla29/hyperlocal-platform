import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8),
  accountType: z.enum(['USER', 'PROVIDER']),
}).refine(
  data => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email'],
  }
);

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string(),
  loginAs: z.enum(['USER', 'PROVIDER']),
}).refine(
  data => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email'],
  }
);
