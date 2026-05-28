import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import StatCard from '@/components/dashboard/StatCard';
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

  // Format subscription date
  const subEndDate = tenant.subscriptionEndAt
    ? new Date(tenant.subscriptionEndAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  // Future modules lists for Phase 2 lock cards
  const lockedModules = [
    {
      title: 'Staff Management',
      description: 'Manage branches, managers, and employee roster access.',
      icon: Users,
    },
    {
      title: 'Customer CRM',
      description: 'Analyze client contact directories and loyalty segments.',
      icon: Settings,
    },
    {
      title: 'Interactive Survey Builder',
      description: 'Design dynamic customer feedback forms and QR campaigns.',
      icon: ClipboardList,
    },
    {
      title: 'Feedback Sentiment History',
      description: 'Detailed analysis of incoming logs and NLP sentiment ratings.',
      icon: History,
    },
  ];

  return (
    <DashboardShell user={user} tenantName={tenant.businessName}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Welcome to {tenant.businessName}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Below is your real-time multi-tenant plan layout and subscription deck.
          </p>
        </div>

        {/* Plan & Profile Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Business Workspace"
            value={tenant.businessName}
            description={`Code: ${tenant.tenantCode}`}
            icon={Building}
            iconColor="text-indigo-400"
            bgGlowClass="group-hover:from-indigo-500/5"
          />

          <StatCard
            title="Active Plan"
            value={tenant.plan?.displayName || 'Trial'}
            description={`Monthly Response limit: ${tenant.plan?.maxMonthlySurveyResponses || 50}`}
            icon={CreditCard}
            iconColor="text-emerald-400"
            bgGlowClass="group-hover:from-emerald-500/5"
          />

          <StatCard
            title="Billing Expiry"
            value={subEndDate}
            description={`Status: ${tenant.status}`}
            icon={CalendarDays}
            iconColor="text-violet-400"
            bgGlowClass="group-hover:from-violet-500/5"
          />

          <StatCard
            title="Your Workspace Role"
            value={user.role === 'BUSINESS_OWNER' ? 'Owner' : 'Staff'}
            description={user.email}
            icon={ShieldCheck}
            iconColor="text-amber-400"
            bgGlowClass="group-hover:from-amber-500/5"
          />
        </div>

        {/* Future Modules Section */}
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              CRM Modules (Coming in Phase 2)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These features are locked during the core infrastructure setup.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {lockedModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/10 p-6 flex gap-4 transition duration-300"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800/80 text-slate-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 pr-12">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal">{mod.description}</p>
                  </div>
                  {/* Lock absolute indicator overlay */}
                  <div className="absolute top-4 right-4 rounded-lg bg-slate-900 border border-slate-850 p-2 text-indigo-500 shadow-inner">
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
