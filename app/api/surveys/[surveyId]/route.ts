import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, SurveyStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageSurveys, canDeleteCrmRecord } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { surveySchema } from '@/validations/survey.validation';
import { createAuditLog } from '@/lib/audit-log';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'No tenant context associated with user' },
        { status: 400 }
      );
    }

    // 1. Fetch survey structure and enforce tenant isolation
    const survey = await prisma.survey.findUnique({
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

    if (!survey || survey.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        survey,
      },
    });
  } catch (error) {
    console.error('Survey GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve survey details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'No tenant context associated with user' },
        { status: 400 }
      );
    }

    // 1. Enforce active tenant context
    try {
      await assertTenantActive();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message || 'Tenant is inactive' },
        { status: 403 }
      );
    }

    // 2. Require canManageSurveys permission
    if (!canManageSurveys(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage surveys.' },
        { status: 403 }
      );
    }

    // 3. Locate existing survey and verify tenant ownership
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!existingSurvey || existingSurvey.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Survey not found' },
        { status: 404 }
      );
    }

    // 4. Validate input payload
    const body = await req.json();
    const result = surveySchema.safeParse(body);

    if (!result.success) {
      const formattedErrors: Record<string, string[]> = {};
      for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
        formattedErrors[key] = val || [];
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid survey inputs',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const oldSurveyValue = JSON.parse(JSON.stringify(existingSurvey));

    // 5. Update structure inside database transaction
    const survey = await prisma.$transaction(async (tx) => {
      // Update survey basic fields
      const updatedSurvey = await tx.survey.update({
        where: { id: surveyId },
        data: {
          name: data.name,
          description: data.description || null,
          greetingText: data.greetingText || null,
          status: data.status || existingSurvey.status,
          modelType: data.modelType,
          defaultLanguage: data.defaultLanguage || 'en',
          goodThreshold: data.goodThreshold,
          badThreshold: data.badThreshold,
        },
      });

      // Clear existing block structures to safely reconstruct (standard Phase 2 approach)
      await tx.surveyBlock.deleteMany({
        where: { surveyId },
      });

      // Loop and recreate blocks, questions, options
      for (const block of data.blocks) {
        const newBlock = await tx.surveyBlock.create({
          data: {
            surveyId,
            blockOrder: block.blockOrder,
            blockGroup: block.blockGroup,
            blockType: block.blockType,
            title: block.title || null,
          },
        });

        for (const question of block.questions) {
          const newQuestion = await tx.surveyQuestion.create({
            data: {
              surveyId,
              blockId: newBlock.id,
              questionText: question.questionText,
              questionType: question.questionType,
              isRequired: question.isRequired,
              orderIndex: question.orderIndex,
              metadataJson: question.metadataJson || undefined,
            },
          });

          if (question.options && question.options.length > 0) {
            for (const option of question.options) {
              await tx.surveyOption.create({
                data: {
                  questionId: newQuestion.id,
                  optionText: option.optionText,
                  orderIndex: option.orderIndex,
                },
              });
            }
          }
        }
      }

      // Fetch the updated survey with relations
      return await tx.survey.findUnique({
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
    });

    if (!survey) {
      throw new Error('Failed to fetch updated survey context');
    }

    // 6. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SURVEY_UPDATED',
      entityType: 'survey',
      entityId: surveyId,
      oldValueJson: oldSurveyValue,
      newValueJson: survey,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Survey updated successfully',
      data: {
        survey,
      },
    });
  } catch (error) {
    console.error('Survey PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update survey details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'No tenant context associated with user' },
        { status: 400 }
      );
    }

    // 1. Enforce active tenant context
    try {
      await assertTenantActive();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message || 'Tenant is inactive' },
        { status: 403 }
      );
    }

    // 2. Require canDeleteCrmRecord (BUSINESS_OWNER only) permission
    if (!canDeleteCrmRecord(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can delete surveys.' },
        { status: 403 }
      );
    }

    // 3. Locate existing survey and verify tenant ownership
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!existingSurvey || existingSurvey.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Survey not found' },
        { status: 404 }
      );
    }

    const oldSurveyValue = JSON.parse(JSON.stringify(existingSurvey));

    // 4. Delete the survey (Prisma cascade delete will remove blocks, questions, options automatically)
    await prisma.survey.delete({
      where: { id: surveyId },
    });

    // 5. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SURVEY_DELETED',
      entityType: 'survey',
      entityId: surveyId,
      oldValueJson: oldSurveyValue,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Survey and all nested blocks deleted successfully',
    });
  } catch (error) {
    console.error('Survey DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}
