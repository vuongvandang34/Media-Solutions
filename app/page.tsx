'use client';

import React from 'react';
import { ArrowRight, Zap, CheckCircle2, ShieldCheck, Sparkles, Building } from 'lucide-react';
import LanguageSelector from '@/components/dashboard/LanguageSelector';

export default function Home() {
  const highlights = [
    'Secure Tenant Sandbox Isolation',
    'Advanced Role-Based Access Control',
    'Conditional Multi-Attempt Captcha Lockouts',
    'Dynamic Client & Admin Dashboards',
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Glow Background Spots */}
      <div className="absolute top-[-20%] left-[-20%] h-[80%] w-[80%] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[70%] w-[70%] rounded-full bg-violet-600/10 blur-[130px]" />

      {/* Landing Header */}
      <header className="relative z-10 mx-auto max-w-6xl w-full px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">FeedbackCRM</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <a
            href="/login"
            className="text-sm font-semibold text-slate-350 hover:text-white transition"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="rounded-lg bg-indigo-650 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600 shadow-lg shadow-indigo-600/10 border border-indigo-500/20"
          >
            Register Business
          </a>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center space-y-8 flex-1 flex flex-col justify-center">
        {/* Sparkle badge */}
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin-slow" />
          <span>SaaS Phase 2 Core CRM Active</span>
        </div>

        {/* Catchy Hero Text */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
            Isolated Workspace. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Empowered Feedback.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg">
            Deploy an isolated CRM feedback tenant for your business. Build interactive surveys, regulate staff permissions, and resolve consumer requests safely within a production-ready, security-first environment.
          </p>
        </div>

        {/* Call to Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4">
          <a
            href="/register"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
          >
            Create Your Business Tenant
            <ArrowRight className="h-4.5 w-4.5" />
          </a>
          <a
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Building className="h-4.5 w-4.5 text-slate-500" />
            Sign In to Workspace
          </a>
        </div>

        {/* Visual Bullet Checkmarks */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-8 border-t border-slate-800/40 text-left text-xs sm:grid-cols-2">
          {highlights.map((text, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-455">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Landing Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-6 py-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:justify-between md:items-start gap-8 text-left text-xs text-slate-500">
          
          {/* Main Footer Description */}
          <div className="space-y-3.5 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">FeedbackCRM</span>
            </div>
            <p className="text-slate-350 leading-relaxed font-medium">
              Công cụ Quản trị Cảm xúc & Trải nghiệm Khách hàng.<br />
              <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15 inline-block mt-1">
                Bản MIỄN PHÍ - Dùng TRỌN ĐỜI - Vì CỘNG ĐỒNG
              </span>
            </p>
          </div>

          {/* Contact Details Layout */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Liên hệ trải nghiệm DEMO ngay hôm nay
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-1 backdrop-blur-sm shadow-sm transition hover:border-slate-700">
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Việt Nam</span>
                <a href="tel:0876896668" className="block text-sm font-black text-white hover:text-indigo-400 transition mt-0.5">
                  📞 087-689-6668
                </a>
              </div>
              
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-1 backdrop-blur-sm shadow-sm transition hover:border-slate-700">
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Mỹ & Canada</span>
                <a href="tel:4456668886" className="block text-sm font-black text-white hover:text-indigo-400 transition mt-0.5">
                  📞 445-666-8886
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright banner */}
        <div className="mx-auto max-w-6xl border-t border-slate-900/60 pt-6 mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center text-[10px] text-slate-600 gap-4">
          <span>&copy; {new Date().getFullYear()} FeedbackCRM SaaS Inc. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-slate-650" />
            Secure 256-bit JWT Session Sandbox Layer
          </span>
        </div>
      </footer>
    </div>
  );
}
