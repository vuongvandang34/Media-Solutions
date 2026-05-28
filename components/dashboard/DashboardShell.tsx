import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  tenantName?: string;
}

export default function DashboardShell({ children, user, tenantName }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased">
      {/* Left Sidebar Menu */}
      <Sidebar currentPath="/dashboard" />

      {/* Main Workspace Frame */}
      <div className="pl-64">
        {/* Top Header */}
        <Header user={user} tenantName={tenantName} />

        {/* Scrollable Content Pane */}
        <main className="min-h-[calc(100vh-4rem)] pt-20 pb-12 px-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
