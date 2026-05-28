import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SurveyTable from '@/components/surveys/SurveyTable';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SurveyStatus, SurveyModelType } from '@prisma/client';

export const metadata = {
  title: 'Survey Builder & Feedback Sheets | Business Feedback CRM',
  description: 'Design and customize multi-part metric pages, choice questions, and feedback collection surveys.',
};

export default async function SurveysPage(
  props: {
    searchParams: Promise<{
      search?: string;
      status?: string;
      modelType?: string;
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
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading workspace details.
      </div>
    );
  }

  // Parse queries
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const modelType = searchParams.modelType || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // Build DB scoping context
  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (status) {
    whereClause.status = status as SurveyStatus;
  }

  if (modelType) {
    whereClause.modelType = modelType as SurveyModelType;
  }

  if (search) {
    whereClause.name = { contains: search, mode: 'insensitive' };
  }

  // Query database in parallel
  const [total, surveysRaw] = await Promise.all([
    prisma.survey.count({ where: whereClause }),
    prisma.survey.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            fullName: true,
          },
        },
      },
      skip,
      take: limit,
    }),
  ]);

  // Map into serializable format for client props
  const surveys = surveysRaw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    greetingText: s.greetingText,
    status: s.status as 'DRAFT' | 'ACTIVE' | 'LOCKED',
    modelType: s.modelType as 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS',
    defaultLanguage: s.defaultLanguage,
    goodThreshold: s.goodThreshold,
    badThreshold: s.badThreshold,
    createdAt: s.createdAt.toISOString(),
    createdBy: s.createdBy
      ? {
          fullName: s.createdBy.fullName,
        }
      : null,
  }));

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/surveys"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Experience Survey Sheets
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Build and configure customizable multi-part metric pages, rating scales, and feedback collection templates.
          </p>
        </div>

        <SurveyTable
          surveys={surveys}
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
