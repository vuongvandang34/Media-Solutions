'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/validations/auth.validation';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      captchaCode: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.ok
        ? await response.json()
        : null;

      if (!response.ok) {
        const errorResult = await response.json();
        
        // Check if Captcha is now required
        if (errorResult.captchaRequired) {
          setCaptchaRequired(true);
        }

        throw new Error(errorResult.error || 'Login failed');
      }

      const { user } = result;

      // Reset local security visual state
      setCaptchaRequired(false);

      // Perform role-based redirects
      if (user.role === 'PLATFORM_OWNER') {
        router.push('/super-admin');
      } else {
        router.push(redirectTo || '/dashboard');
      }

      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-400">Sign in to your CRM tenant workspace.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 animate-pulse">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-slate-300">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="admin@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-slate-300">
              Password
            </label>
            <a href="/forgot-password" className="text-xs text-indigo-400 hover:underline">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>

        {captchaRequired && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>Multi-attempt Captcha Verification Required</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-slate-850 border border-slate-700 select-none text-slate-300 font-mono tracking-widest text-center px-4 py-1.5 rounded text-sm font-bold skew-x-3 shadow-inner">
                1234
              </div>
              <div className="flex-1 space-y-1">
                <input
                  id="captchaCode"
                  type="text"
                  placeholder="Enter captcha"
                  {...register('captchaCode')}
                  className="w-full rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Enter the skewed digits above to verify you are a human agent.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          New business?{' '}
          <a href="/register" className="font-semibold text-indigo-400 hover:underline">
            Register your tenant
          </a>
        </p>
      </form>
    </div>
  );
}
