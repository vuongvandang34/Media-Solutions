import React from 'react';
import { prisma } from '@/lib/prisma';
import PublicSurveyView from '@/components/surveys/PublicSurveyView';
import { notFound } from 'next/navigation';

export async function generateMetadata(
  props: {
    params: Promise<{ surveyId: string }>;
  }
) {
  const params = await props.params;
  const { surveyId } = params;
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { name: true, description: true },
  });

  if (!survey) {
    return {
      title: 'Survey Not Found | FeedbackCRM',
    };
  }

  return {
    title: `${survey.name} | Customer Satisfaction Survey`,
    description: survey.description || 'Provide your valuable experience rating details.',
  };
}

export default async function PublicSurveyPage(
  props: {
    params: Promise<{ surveyId: string }>;
  }
) {
  const params = await props.params;
  const { surveyId } = params;
  
  // Retrieve survey block structures
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

  if (!surveyRaw) {
    notFound();
  }

  // Retrieve tenant branding
  const tenant = await prisma.tenant.findUnique({
    where: { id: surveyRaw.tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    notFound();
  }

  // Format into serializable structures
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
    allowPromotionPhoto: tenant.plan?.allowPromotionPhoto ?? false,
  };

  return <PublicSurveyView survey={survey} branding={branding} />;
}
