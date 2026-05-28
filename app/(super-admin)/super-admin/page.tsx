import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, TenantStatus } from '@prisma/client';
import StatCard from '@/components/dashboard/StatCard';
import Header from '@/components/dashboard/Header';
import {
  Building,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Platform Admin Console | Business Feedback CRM',
  description: 'Manage SaaS tenants, plans, and system audit logs.',
};

export default async function SuperAdminPage() {
  // 1. Restrict to PLATFORM_OWNER only
  const user = await requireRole([UserRole.PLATFORM_OWNER]);

  // 2. Query statistics using Prisma
  const [
    totalTenants,
    activeTenants,
    pendingTenants,
    expiredTenants,
    totalUsers,
    recentTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
    prisma.tenant.count({ where: { status: TenantStatus.PENDING } }),
    prisma.tenant.count({ where: { status: TenantStatus.EXPIRED } }),
    prisma.user.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { plan: true },
    }),
  ]);

  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case TenantStatus.PENDING:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case TenantStatus.EXPIRED:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased">
      {/* Top Navigation */}
      <Header
        user={user}
        tenantName="Platform Control Center"
      />

      <main className="mx-auto max-w-6xl pt-24 pb-16 px-6 sm:px-8 space-y-8">
        {/* Banner Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Platform Administrative Mode</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Global Platform Overview
            </h1>
            <p className="text-sm text-slate-400">
              Real-time monitoring metrics and tenant workspace rosters.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs text-slate-300">
            <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>Updates: Live (Prisma Engine)</span>
          </div>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            description="Workspaces registered"
            icon={Building}
            iconColor="text-indigo-400"
            bgGlowClass="group-hover:from-indigo-500/5"
          />

          <StatCard
            title="Active Tenants"
            value={activeTenants}
            description="Active billing/trials"
            icon={TrendingUp}
            iconColor="text-emerald-400"
            bgGlowClass="group-hover:from-emerald-500/5"
          />

          <StatCard
            title="Pending Activation"
            value={pendingTenants}
            description="Unverified emails"
            icon={Clock}
            iconColor="text-yellow-400"
            bgGlowClass="group-hover:from-yellow-500/5"
          />

          <StatCard
            title="Expired Billing"
            value={expiredTenants}
            description="Billing suspended"
            icon={ShieldCheck}
            iconColor="text-amber-400"
            bgGlowClass="group-hover:from-amber-500/5"
          />

          <StatCard
            title="Registered Users"
            value={totalUsers}
            description="All platform accounts"
            icon={Users}
            iconColor="text-violet-400"
            bgGlowClass="group-hover:from-violet-500/5"
          />
        </div>

        {/* Recent Registrations Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>Recent Tenants Workspace Logs</span>
            </h2>
            <span className="text-xs text-slate-500">Showing last 10 trials</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Owner Email</th>
                    <th className="px-6 py-4">Country</th>
                    <th className="px-6 py-4">Assigned Plan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-transparent">
                  {recentTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500">
                        No tenant registrations recorded in the database yet.
                      </td>
                    </tr>
                  ) : (
                    recentTenants.map((tenant) => (
                      <tr key={tenant.id} className="transition duration-150 hover:bg-slate-900/30">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white truncate max-w-[180px]">
                            {tenant.businessName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Code: {tenant.tenantCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-350">{tenant.ownerEmail}</span>
                          {tenant.ownerPhone && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{tenant.ownerPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-350">
                            <Globe className="h-3.5 w-3.5 text-slate-500" />
                            <span>{tenant.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200">
                              {tenant.plan?.displayName || 'Trial'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(tenant.status)}`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(tenant.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
