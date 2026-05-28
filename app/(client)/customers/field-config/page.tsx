import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import CustomerFieldConfigForm from '@/components/customers/CustomerFieldConfigForm';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Customer Field Configurations | Business Feedback CRM',
  description: 'Customize enabled and required parameters in your client directory.',
};

export default async function CustomerFieldConfigPage() {
  const user = await requireAuth();

  // Enforce active tenant context
  try {
    await assertTenantActive();
  } catch (error) {
    redirect('/dashboard');
  }

  // Strictly restrict to BUSINESS_OWNER only
  if (user.role !== 'BUSINESS_OWNER') {
    redirect('/customers');
  }

  const tenant = user.tenant;
  if (!tenant) {
    return <div>Error loading workspace details.</div>;
  }

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/customers/field-config"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Customer Field Configuration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Customize which parameter fields are active and mandatory inside your customer-facing contact directories.
          </p>
        </div>

        <CustomerFieldConfigForm />
      </div>
    </DashboardShell>
  );
}
