import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BrandingForm from '@/components/settings/BrandingForm';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Branding Settings | Business Feedback CRM',
  description: 'Manage your SaaS business logo and survey promotion photos.',
};

export default async function BrandingPage() {
  const user = await requireAuth();

  // Enforce active tenant context
  try {
    await assertTenantActive();
  } catch (error) {
    redirect('/dashboard');
  }

  // Restrict to roles that can manage settings (BUSINESS_OWNER, MANAGER)
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
      currentPath="/settings/branding"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Branding Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Customize your brand assets, logo, and marketing banners shown to your customers.
          </p>
        </div>

        <BrandingForm tenant={tenant} />
      </div>
    </DashboardShell>
  );
}
