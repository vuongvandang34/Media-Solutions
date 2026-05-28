import React, { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login | Business Feedback CRM',
  description: 'Sign in to your multi-tenant feedback dashboard.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] w-full max-w-md items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-slate-400">
          Loading login form...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

