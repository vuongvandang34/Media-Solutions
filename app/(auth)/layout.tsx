import React from 'react';
import { Star, BarChart3, Users, Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Left Column: Premium SaaS Product Showcase (Desktop Only) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 px-12 py-16 lg:flex">
        {/* Decorative dynamic background glow spots */}
        <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-violet-500/10 blur-[100px]" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            FeedbackCRM
          </span>
        </div>

        {/* Brand Message and Showcase */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Turn customer feedback into{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              business growth
            </span>
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            The ultimate multi-tenant CRM feedback deck. Design interactive surveys, capture staff responses, analyze sentiment, and resolve client crises automatically with integrated AI companions.
          </p>

          {/* Features showcase */}
          <div className="space-y-4 pt-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-indigo-400 shadow-inner">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Advanced Survey Builder</h4>
                <p className="text-xs text-slate-400 mt-0.5">Deploy multilingual feedback forms in seconds.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-indigo-400 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Staff Management Scopes</h4>
                <p className="text-xs text-slate-400 mt-0.5">Control staff roles, branches, and manager alerts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-6 border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <span>© 2026 FeedbackCRM Inc.</span>
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
        </div>
      </div>

      {/* Right Column: Interative Form View (Mobile & Desktop) */}
      <div className="relative flex w-full flex-col justify-center bg-slate-950 px-6 py-12 lg:w-1/2 lg:px-16">
        {/* Glow highlights for mobile */}
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[80px] lg:hidden" />
        
        <div className="relative z-10 flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
