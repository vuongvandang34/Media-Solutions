'use client';

import React from 'react';
import { LayoutDashboard, Users, ClipboardList, History, Lock, Zap } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      active: true,
      locked: false,
    },
    {
      name: 'Staff Management',
      icon: Users,
      active: false,
      locked: true,
    },
    {
      name: 'Customer CRM',
      icon: Users,
      active: false,
      locked: true,
    },
    {
      name: 'Survey Builder',
      icon: ClipboardList,
      active: false,
      locked: true,
    },
    {
      name: 'Feedback History',
      icon: History,
      active: false,
      locked: true,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-900 px-4 py-6 text-slate-300">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-wide">FeedbackCRM</span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ${
                item.locked
                  ? 'cursor-not-allowed text-slate-500 opacity-60'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${item.locked ? 'text-slate-600' : 'text-indigo-200'}`} />
                <span>{item.name}</span>
              </div>
              {item.locked && (
                <span className="rounded bg-slate-800 p-1 text-[10px] text-slate-500 group-hover:text-slate-400">
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-800/80 pt-4 px-2 text-[10px] text-slate-500">
        <span className="block font-medium text-slate-400">SaaS Workspace</span>
        <span>Version 1.0.0 (Phase 1)</span>
      </div>
    </aside>
  );
}
