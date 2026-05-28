import React from 'react';
import { requireAuth } from '@/lib/auth';
import { assertTenantActive } from '@/lib/tenant';
import { getTenantPlanLimits } from '@/lib/plan-limits';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SurveyPreview from '@/components/surveys/SurveyPreview';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Interactive Survey Preview | Business Feedback CRM',
  description: 'Simulate and test customer experiences in a high-fidelity mobile framework.',
};

export default async function PreviewSurveyPage(
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

  const tenant = user.tenant;
  if (!tenant || !user.tenantId) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading workspace details.
      </div>
    );
  }

  // Fetch plan limits to enforce promotional rules
  const planLimits = await getTenantPlanLimits(user.tenantId);

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
  const survey = {
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

  const branding = {
    businessName: tenant.businessName,
    logoUrl: tenant.logoUrl,
    promotionPhotoUrl: tenant.promotionPhotoUrl,
    allowPromotionPhoto: planLimits.allowPromotionPhoto,
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
            Live Preview Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Interact with your custom rating cards and simulate response triggers in our mobile-first wrapper.
          </p>
        </div>

        <SurveyPreview survey={survey} branding={branding} />
      </div>
    </DashboardShell>
  );
}
