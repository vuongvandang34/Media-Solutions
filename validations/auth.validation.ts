import { z } from 'zod';

export const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(100, 'Business name must be at most 100 characters'),
    businessAddress: z
      .string()
      .min(5, 'Business address must be at least 5 characters')
      .max(255, 'Business address must be at most 255 characters'),
    country: z.string().min(1, 'Country is required'),
    ownerName: z
      .string()
      .min(2, 'Owner name must be at least 2 characters')
      .max(100, 'Owner name must be at most 100 characters'),
    ownerEmail: z.string().email('Invalid email address'),
    ownerPhone: z.string().refine(
      (val) => {
        // Allow leading + for country code, then clean non-digits
        const cleaned = val.replace(/^\+/, '').replace(/\D/g, '');
        return cleaned.length > 0 && cleaned.length <= 12;
      },
      {
        message: 'Phone number must be at most 12 digits (excluding leading + prefix)',
      }
    ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(16, 'Password must be at most 16 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  captchaCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(16, 'Password must be at most 16 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
