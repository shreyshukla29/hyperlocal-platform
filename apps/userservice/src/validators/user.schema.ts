import { z } from 'zod';

const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

const trimString = (val: string) => val.trim();
const toLowerCase = (val: string) => val.toLowerCase();

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    usernameRegex,
    'Username can only contain letters, numbers, and underscores',
  )
  .transform(toLowerCase)
  .transform(trimString);

const firstNameSchema = z
  .string()
  .min(1, 'First name is required')
  .max(100, 'First name must be at most 100 characters')
  .transform(trimString)
  .refine(
    (val) => val.length > 0,
    'First name cannot be empty after trimming',
  );

const lastNameSchema = z
  .string()
  .max(100, 'Last name must be at most 100 characters')
  .transform(trimString)
  .nullable();

export const updateUserProfileSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    username: usernameSchema.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export type UpdateUserProfilePayload = z.infer<
  typeof updateUserProfileSchema
>;
