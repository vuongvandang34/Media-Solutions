import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { getTenantPlanLimits } from '@/lib/plan-limits';
import DashboardShell from '@/components/dashboard/DashboardShell';
import StaffTable from '@/components/staff/StaffTable';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { StaffStatus } from '@prisma/client';

export const metadata = {
  title: 'Staff Management | Business Feedback CRM',
  description: 'Manage your branch staff members and credentials.',
};

export default async function StaffPage(
  props: {
    searchParams: Promise<{
      search?: string;
      status?: string;
      page?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requireAuth();

  // Enforce active tenant context
  try {
    await assertTenantActive();
  } catch (error) {
    redirect('/dashboard');
  }

  const tenant = user.tenant;
  if (!tenant || !user.tenantId) {
    return <div>Error loading workspace details.</div>;
  }

  // Parse query parameters
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // Build DB query scoping context
  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (status) {
    whereClause.status = status as StaffStatus;
  }

  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { staffCode: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Fetch plan limits and staff database records in parallel
  const [planLimits, total, staffRaw] = await Promise.all([
    getTenantPlanLimits(user.tenantId),
    prisma.staff.count({ where: whereClause }),
    prisma.staff.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  // Map staff records into string-serializable formats for client props
  const staff = staffRaw.map((s) => ({
    id: s.id,
    staffCode: s.staffCode,
    fullName: s.fullName,
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    status: s.status as 'ACTIVE' | 'ABSENT' | 'RESIGNED',
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/staff"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View, add, and organize employee profiles within your business workspace.
          </p>
        </div>

        <StaffTable
          staff={staff}
          total={total}
          currentPage={currentPage}
          limit={limit}
          currentUser={{
            id: user.id,
            role: user.role,
          }}
          planLimits={{
            maxStaff: planLimits.maxStaff,
            planName: planLimits.planName,
          }}
        />
      </div>
    </DashboardShell>
  );
}
