'use client';

import React, { useState } from 'react';
import { User, LogOut, ChevronDown, Building, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  tenantName?: string;
}

export default function Header({ user, tenantName }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PLATFORM_OWNER':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'BUSINESS_OWNER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <header className="fixed top-0 right-0 z-10 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 backdrop-blur-md">
      {/* Left side info */}
      <div className="flex items-center gap-2">
        <Building className="h-4.5 w-4.5 text-slate-500" />
        <span className="text-sm font-semibold text-white">
          {tenantName || 'Global Platform Deck'}
        </span>
      </div>

      {/* Right side profile */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-sm transition hover:bg-slate-800/80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-400">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-white leading-none">
              {user.fullName}
            </span>
            <span className="block text-[9px] text-slate-400 mt-0.5 capitalize leading-none">
              {user.role.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-20">
              <div className="px-3 py-2 border-b border-slate-800 text-xs">
                <span className="block font-semibold text-white truncate">{user.fullName}</span>
                <span className="block text-slate-400 text-[10px] truncate mt-0.5">{user.email}</span>
                <div className={`mt-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold ${getRoleBadgeColor(user.role)}`}>
                  <ShieldCheck className="h-3 w-3" />
                  <span>{user.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
