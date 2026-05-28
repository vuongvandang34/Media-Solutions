'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/validations/auth.validation';
import { Loader2, KeyRound, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit recovery request');
      }

      setSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
          <MailCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">Reset Link Dispatched</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          If that email address exists in our system, you will receive a message with instructions to reset your password.
        </p>
        <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500">
          Local development note: The recovery link has been printed to the server terminal console.
        </div>
        <a
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Forgot password?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email and we will generate a secure recovery link.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {errorMessage}
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

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
            </>
          ) : (
            'Generate Reset Link'
          )}
        </button>

        <a
          href="/login"
          className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white pt-2 transition"
        >
          <ArrowLeft className="h-3 w-3" /> Back to login
        </a>
      </form>
    </div>
  );
}
