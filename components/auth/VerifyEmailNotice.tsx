'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface VerifyEmailNoticeProps {
  token: string | null;
}

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailNotice({ token }: VerifyEmailNoticeProps) {
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string>('Verifying your email token...');
  const didRun = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React StrictMode
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please verify your link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Verification failed');
        }

        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Verification token is invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-center">
      {status === 'loading' && (
        <div className="space-y-4 py-6">
          <Loader2 className="mx-auto h-12 w-12 text-indigo-500 animate-spin" />
          <h3 className="text-xl font-bold text-white">Verifying account...</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-4 animate-fade-in">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
          <h3 className="text-xl font-bold text-white font-heading">Account Activated</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your tenant workspace is now active. You may log in to start using the system.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none"
          >
            Log In <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4">
          <XCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="text-xl font-bold text-white">Activation Failed</h3>
          <p className="text-sm text-rose-400 leading-relaxed">{message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please make sure you have copied the correct URL or request a new verification token.
          </p>
          <a
            href="/register"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-750 focus:outline-none"
          >
            Create New Account
          </a>
        </div>
      )}
    </div>
  );
}
