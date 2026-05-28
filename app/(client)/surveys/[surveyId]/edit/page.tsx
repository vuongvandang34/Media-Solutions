import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { canManageSurveys } from '@/lib/permissions';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SurveyBuilder from '@/components/surveys/SurveyBuilder';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Edit Survey Layout | Business Feedback CRM',
  description: 'Customize and reorder survey pages, metric blocks, and choice options.',
};

export default async function EditSurveyPage(
  props: {
    params: Promise<{ surveyId: string }>;
  }
) {
  const params = await props.params;
  const { surveyId } = params;
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

  // Retrieve survey structure
  const surveyRaw = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      blocks: {
        orderBy: { blockOrder: 'asc' },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              options: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  // Verify ownership
  if (!surveyRaw || surveyRaw.tenantId !== user.tenantId) {
    redirect('/surveys');
  }

  // Format into client-safe serializable object
  const initialData = {
    id: surveyRaw.id,
    name: surveyRaw.name,
    description: surveyRaw.description,
    greetingText: surveyRaw.greetingText,
    status: surveyRaw.status as 'DRAFT' | 'ACTIVE' | 'LOCKED',
    modelType: surveyRaw.modelType as 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS',
    defaultLanguage: surveyRaw.defaultLanguage,
    goodThreshold: surveyRaw.goodThreshold,
    badThreshold: surveyRaw.badThreshold,
    blocks: surveyRaw.blocks.map((block) => ({
      id: block.id,
      blockOrder: block.blockOrder,
      blockGroup: block.blockGroup,
      blockType: block.blockType,
      title: block.title || '',
      questions: block.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
        metadataJson: q.metadataJson,
        options: q.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          orderIndex: o.orderIndex,
        })),
      })),
    })),
  };

  return (
    <DashboardShell
      user={user}
      tenantName={tenant.businessName}
      currentPath="/surveys"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Modify Survey Layout: {surveyRaw.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Edit blocks, update rating questions, or add choice options for this survey template.
          </p>
        </div>

        <div className="max-w-4xl">
          <SurveyBuilder initialData={initialData} />
        </div>
      </div>
    </DashboardShell>
  );
}
