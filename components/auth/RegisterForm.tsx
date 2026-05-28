'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/validations/auth.validation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      businessAddress: '',
      country: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccessMessage(result.message);
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center shadow-lg backdrop-blur-md">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
        <h3 className="mt-4 text-xl font-bold text-slate-100">Verify Your Account</h3>
        <p className="mt-2 text-slate-300 text-sm leading-relaxed">{successMessage}</p>
        <div className="mt-6 border-t border-slate-700/50 pt-4 text-xs text-slate-400">
          Local development: The email verification link has been printed to the server terminal console.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Create your business account</h2>
        <p className="mt-1 text-sm text-slate-400">Start managing customer feedbacks in minutes.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
            Business Profile
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="businessName" className="text-xs font-medium text-slate-300">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                {...register('businessName')}
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.businessName && (
                <p className="text-xs text-rose-400 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="country" className="text-xs font-medium text-slate-300">
                Country
              </label>
              <input
                id="country"
                type="text"
                {...register('country')}
                placeholder="Vietnam"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.country && <p className="text-xs text-rose-400 mt-1">{errors.country.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="businessAddress" className="text-xs font-medium text-slate-300">
              Business Address
            </label>
            <input
              id="businessAddress"
              type="text"
              {...register('businessAddress')}
              placeholder="123 Innovation St, District 1"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.businessAddress && (
              <p className="text-xs text-rose-400 mt-1">{errors.businessAddress.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
            Owner Profile
          </h3>

          <div className="space-y-1">
            <label htmlFor="ownerName" className="text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              id="ownerName"
              type="text"
              {...register('ownerName')}
              placeholder="John Doe"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.ownerName && <p className="text-xs text-rose-400 mt-1">{errors.ownerName.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="ownerEmail" className="text-xs font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="ownerEmail"
                type="email"
                {...register('ownerEmail')}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.ownerEmail && (
                <p className="text-xs text-rose-400 mt-1">{errors.ownerEmail.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ownerPhone" className="text-xs font-medium text-slate-300">
                Phone Number
              </label>
              <input
                id="ownerPhone"
                type="text"
                {...register('ownerPhone')}
                placeholder="+84987654321"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.ownerPhone && (
                <p className="text-xs text-rose-400 mt-1">{errors.ownerPhone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            id="termsAccepted"
            type="checkbox"
            {...register('termsAccepted')}
            className="h-4 w-4 rounded border-slate-700 bg-slate-850 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 mt-0.5"
          />
          <div className="flex-1">
            <label htmlFor="termsAccepted" className="text-xs text-slate-300 select-none">
              I agree to the{' '}
              <a href="#" className="text-indigo-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-400 hover:underline">
                Privacy Policy
              </a>
              .
            </label>
            {errors.termsAccepted && (
              <p className="text-xs text-rose-400 mt-1">{errors.termsAccepted.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : (
            'Register Business'
          )}
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-indigo-400 hover:underline">
            Login here
          </a>
        </p>
      </form>
    </div>
  );
}
