import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { canManageSurveys } from '@/lib/permissions';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SurveyBuilder from '@/components/surveys/SurveyBuilder';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Construct Custom Survey | Business Feedback CRM',
  description: 'Design brand-customized customer satisfaction, CSAT, CES, or NPS survey pages.',
};

export default async function CreateSurveyPage() {
  const user = await requireAuth();

  // Enforce active tenant context
  try {
    await assertTenantActive();
  } catch (error) {
    redirect('/dashboard');
  }

  // Authorize user role
  if (!canManageSurveys(user)) {
    redirect('/surveys');
  }

  const tenant = user.tenant;
  if (!tenant || !user.tenantId) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading workspace details.
      </div>
    );
  }

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/surveys"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Build New Survey Layout
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select your metric page block layout count and configure custom rating scales.
          </p>
        </div>

        <div className="max-w-4xl">
          <SurveyBuilder />
        </div>
      </div>
    </DashboardShell>
  );
}
