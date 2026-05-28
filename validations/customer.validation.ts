import { z } from 'zod';
import { CustomerStatus } from '@prisma/client';

export const customerSchema = z.object({
  customerCode: z
    .string()
    .min(2, 'Customer code must be at least 2 characters')
    .max(50, 'Customer code must be under 50 characters')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Customer code can only contain alphanumeric characters, hyphens, and underscores'),
  name: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be under 100 characters'),
  phone: z
    .string()
    .min(5, 'Phone must be at least 5 characters')
    .max(20, 'Phone must be under 20 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  birthday: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  company: z
    .string()
    .max(100, 'Company name must be under 100 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .max(255, 'Address must be under 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  note: z
    .string()
    .max(1000, 'Note must be under 1000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z
    .nativeEnum(CustomerStatus)
    .default(CustomerStatus.ACTIVE)
    .optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
