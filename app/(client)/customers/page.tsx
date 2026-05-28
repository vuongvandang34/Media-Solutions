import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import CustomerTable from '@/components/customers/CustomerTable';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CustomerStatus } from '@prisma/client';

export const metadata = {
  title: 'Customer Directory CRM | Business Feedback CRM',
  description: 'Manage your client directories, profiles, and customer-satisfaction ratings.',
};

export default async function CustomersPage(
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

  // Parse queries
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // Build DB scoping context
  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (status) {
    whereClause.status = status as CustomerStatus;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { customerCode: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Query database in parallel
  const [total, customersRaw] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  // Map into serializable string elements for client props
  const customers = customersRaw.map((c) => ({
    id: c.id,
    customerCode: c.customerCode,
    name: c.name,
    phone: c.phone,
    email: c.email,
    birthday: c.birthday ? c.birthday.toISOString() : null,
    website: c.website,
    company: c.company,
    address: c.address,
    note: c.note,
    status: c.status as 'ACTIVE' | 'LOCKED',
    averageRating: c.averageRating ? Number(c.averageRating) : null,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/customers"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Customer Registry CRM
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor client contact directories, search customer codes, and explore satisfaction metrics.
          </p>
        </div>

        <CustomerTable
          customers={customers}
          total={total}
          currentPage={currentPage}
          limit={limit}
          currentUser={{
            id: user.id,
            role: user.role,
          }}
        />
      </div>
    </DashboardShell>
  );
}
