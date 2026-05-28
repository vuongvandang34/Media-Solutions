import { z } from 'zod';
import { StaffStatus } from '@prisma/client';

export const staffSchema = z.object({
  staffCode: z
    .string()
    .min(2, 'Staff code must be at least 2 characters')
    .max(30, 'Staff code must be under 30 characters')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Staff code can only contain alphanumeric characters, hyphens, and underscores'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters'),
  phone: z
    .string()
    .max(20, 'Phone must be under 20 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z
    .nativeEnum(StaffStatus)
    .default(StaffStatus.ACTIVE)
    .optional(),
});

export type StaffInput = z.infer<typeof staffSchema>;
