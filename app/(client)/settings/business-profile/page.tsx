import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { canManageBranding } from '@/lib/permissions';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BusinessProfileForm from '@/components/settings/BusinessProfileForm';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Business Profile | Business Feedback CRM',
  description: 'Manage your SaaS business workspace settings.',
};

export default async function BusinessProfilePage() {
  const user = await requireAuth();

  // Enforce active tenant context
  try {
    await assertTenantActive();
  } catch (error) {
    redirect('/dashboard');
  }

  // Restrict to roles that can view/manage profile (BUSINESS_OWNER, MANAGER)
  if (user.role === 'STAFF') {
    redirect('/dashboard');
  }

  const tenant = user.tenant;
  if (!tenant) {
    return <div>Error loading tenant details.</div>;
  }

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/settings/business-profile"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Business Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure your multi-tenant workspace credentials, address, and owner contacts.
          </p>
        </div>

        {user.role === 'MANAGER' && (
          <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> You have <strong>Manager</strong> access. You can view these details but editing is restricted to the <strong>Business Owner</strong>.
            </span>
          </div>
        )}

        <BusinessProfileForm initialTenant={tenant} />
      </div>
    </DashboardShell>
  );
}
