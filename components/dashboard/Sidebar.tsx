'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  History,
  Lock,
  Zap,
  Building,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  userRole?: string;
}

export default function Sidebar({ currentPath, userRole }: SidebarProps) {
  const isStaff = userRole === 'STAFF';

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      visible: true,
    },
    {
      name: 'Business Profile',
      icon: Building,
      href: '/settings/business-profile',
      visible: !isStaff,
    },
    {
      name: 'Branding Settings',
      icon: ImageIcon,
      href: '/settings/branding',
      visible: !isStaff,
    },
    {
      name: 'Staff Management',
      icon: Users,
      href: '/staff',
      visible: true,
    },
    {
      name: 'Customer CRM',
      icon: Users,
      href: '/customers',
      visible: true,
    },
    {
      name: 'Customer Fields',
      icon: Sliders,
      href: '/customers/field-config',
      visible: !isStaff,
    },
    {
      name: 'Survey Builder',
      icon: ClipboardList,
      href: '/surveys',
      visible: true,
    },
    {
      name: 'Feedback History',
      icon: History,
      href: '#',
      locked: true,
      visible: true,
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
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {menuItems
          .filter((item) => item.visible)
          .map((item, idx) => {
            const Icon = item.icon;
            // Support child sub-routes highlighting, e.g. /staff/create matches /staff
            const isActive = currentPath === item.href || (item.href !== '/dashboard' && item.href !== '#' && currentPath.startsWith(item.href));

            if (item.locked) {
              return (
                <div
                  key={idx}
                  className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 text-slate-600" />
                    <span>{item.name}</span>
                  </div>
                  <span className="rounded bg-slate-800 p-1 text-[10px] text-slate-500 group-hover:text-slate-400">
                    <Lock className="h-3 w-3" />
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-800/80 pt-4 px-2 text-[10px] text-slate-500">
        <span className="block font-medium text-slate-400">SaaS Workspace</span>
        <span>Version 2.0.0 (Phase 2)</span>
      </div>
    </aside>
  );
}
