import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { getTenantPlanLimits } from '@/lib/plan-limits';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/dashboard/DashboardShell';
import StatCard from '@/components/dashboard/StatCard';
import Link from 'next/link';
import {
  Building,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  Lock,
  Users,
  Settings,
  ClipboardList,
  History,
  Image as ImageIcon,
  Sliders,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Workspace Dashboard | Business Feedback CRM',
  description: 'Manage your business tenant settings and customer surveys.',
};

export default async function DashboardPage() {
  // 1. Authenticate user
  const user = await requireAuth();

  // 2. Enforce active tenant context (handles auto-expiration and redirects/throws)
  try {
    await assertTenantActive();
  } catch (error: any) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-white font-heading">Workspace Suspended</h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {error.message || 'Your business account is currently inactive.'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Please contact support or update your subscription payment plan to restore full system access.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-750"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  // Ensure tenant is loaded
  const tenant = user.tenant;
  if (!tenant) {
    return <div>Error loading workspace details.</div>;
  }

  // 3. Load dynamic database statistics
  const [staffCount, customerCount, surveyCount, planLimits] = await Promise.all([
    prisma.staff.count({
      where: {
        tenantId: tenant.id,
        status: { not: 'RESIGNED' },
      },
    }),
    prisma.customer.count({
      where: {
        tenantId: tenant.id,
      },
    }),
    prisma.survey.count({
      where: {
        tenantId: tenant.id,
      },
    }),
    getTenantPlanLimits(tenant.id),
  ]);

  // Format subscription date
  const subEndDate = tenant.subscriptionEndAt
    ? new Date(tenant.subscriptionEndAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  const isStaff = user.role === 'STAFF';

  // Navigation modules for CRM Core Setup
  const navigationModules = [
    {
      title: 'Staff Management',
      description: 'Manage branches, managers, and employee roster access.',
      icon: Users,
      href: '/staff',
      active: true,
    },
    {
      title: 'Customer CRM',
      description: 'Analyze client contact directories and dynamic profile configs.',
      icon: Users,
      href: '/customers',
      active: true,
    },
    {
      title: 'Interactive Survey Builder',
      description: 'Design dynamic customer feedback forms and multi-metric templates.',
      icon: ClipboardList,
      href: '/surveys',
      active: true,
    },
    {
      title: 'Business Profile Settings',
      description: 'Update business address, owner credentials, and phone records.',
      icon: Settings,
      href: '/settings/business-profile',
      active: !isStaff,
    },
    {
      title: 'Branding Settings',
      description: 'Upload business logo and survey promotion photo banners.',
      icon: ImageIcon,
      href: '/settings/branding',
      active: !isStaff,
    },
    {
      title: 'Feedback Sentiment History',
      description: 'NLP sentiment ratings and charts (Coming in Phase 3).',
      icon: History,
      href: '#',
      active: false,
    },
  ];

  return (
    <DashboardShell user={user} tenantName={tenant.businessName} currentPath="/dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
              Welcome to {tenant.businessName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your real-time feedback database, subscription plan, and system metrics deck.
            </p>
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs text-slate-350">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Workspace: {tenant.tenantCode}</span>
          </div>
        </div>

        {/* Real-time metrics deck */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Plan"
            value={planLimits.planName}
            description={`Monthly Response limit: ${tenant.plan?.maxMonthlySurveyResponses || 50}`}
            icon={CreditCard}
            iconColor="text-indigo-400"
            bgGlowClass="group-hover:from-indigo-500/5"
          />

          <StatCard
            title="Staff Roster"
            value={`${staffCount} / ${planLimits.maxStaff}`}
            description="Active employees registered"
            icon={Users}
            iconColor="text-emerald-400"
            bgGlowClass="group-hover:from-emerald-500/5"
          />

          <StatCard
            title="Customer Registry"
            value={customerCount}
            description="Client contact directories"
            icon={Building}
            iconColor="text-violet-400"
            bgGlowClass="group-hover:from-violet-500/5"
          />

          <StatCard
            title="Active Surveys"
            value={surveyCount}
            description={`Promo Photo: ${planLimits.allowPromotionPhoto ? 'Enabled' : 'Locked'}`}
            icon={ClipboardList}
            iconColor="text-amber-400"
            bgGlowClass="group-hover:from-amber-500/5"
          />
        </div>

        {/* Action Modules Grid */}
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              CRM Control Center Modules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch tools and configurations to manage customer feedback interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {navigationModules.map((mod, idx) => {
              const Icon = mod.icon;
              const isLocked = !mod.active;

              if (isLocked) {
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/10 p-6 flex gap-4 transition duration-300 opacity-50 cursor-not-allowed group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-850 text-slate-500">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                        <span>{mod.title}</span>
                      </h3>
                      <p className="text-xs text-slate-550 leading-normal">{mod.description}</p>
                    </div>
                    <div className="absolute top-4 right-4 rounded-lg bg-slate-950 border border-slate-850 p-2 text-slate-600 shadow-inner">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={idx}
                  href={mod.href}
                  className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-6 flex gap-4 hover:border-slate-700 hover:bg-slate-900/55 transition duration-300 group"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 group-hover:text-indigo-300 group-hover:bg-slate-900 transition">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 pr-6">
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5 transition">
                      <span>{mod.title}</span>
                    </h3>
                    <p className="text-xs text-slate-450 leading-normal">{mod.description}</p>
                  </div>
                  <div className="absolute top-4 right-4 text-slate-650 group-hover:text-indigo-400 transition transform group-hover:translate-x-1 duration-300">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
