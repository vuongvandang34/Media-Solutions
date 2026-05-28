import { z } from 'zod';

export const tenantProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  businessAddress: z.string().min(5, 'Business address must be at least 5 characters').max(255),
  country: z.string().min(1, 'Country is required'),
});

export type TenantProfileInput = z.infer<typeof tenantProfileSchema>;
