import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, SurveyStatus, SurveyModelType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageSurveys } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { surveySchema } from '@/validations/survey.validation';
import { createAuditLog } from '@/lib/audit-log';

export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const modelType = searchParams.get('modelType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

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

    const [total, items] = await Promise.all([
      prisma.survey.count({ where: whereClause }),
      prisma.survey.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
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
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Surveys retrieved successfully',
      data: {
        items,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Surveys GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve surveys list' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can construct surveys.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // 3. Validate input payload using Zod refine schema
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

    // 4. Perform transactional write to database (nesting: survey -> blocks -> questions -> options)
    const survey = await prisma.$transaction(async (tx) => {
      // Create primary Survey record
      const newSurvey = await tx.survey.create({
        data: {
          tenantId: user.tenantId!,
          name: data.name,
          description: data.description || null,
          greetingText: data.greetingText || null,
          status: data.status || SurveyStatus.DRAFT,
          modelType: data.modelType,
          defaultLanguage: data.defaultLanguage || 'en',
          goodThreshold: data.goodThreshold,
          badThreshold: data.badThreshold,
          createdById: user.id,
        },
      });

      // Loop and create nested blocks
      for (const block of data.blocks) {
        const newBlock = await tx.surveyBlock.create({
          data: {
            surveyId: newSurvey.id,
            blockOrder: block.blockOrder,
            blockGroup: block.blockGroup,
            blockType: block.blockType,
            title: block.title || null,
          },
        });

        // Loop and create nested questions under block
        for (const question of block.questions) {
          const newQuestion = await tx.surveyQuestion.create({
            data: {
              surveyId: newSurvey.id,
              blockId: newBlock.id,
              questionText: question.questionText,
              questionType: question.questionType,
              isRequired: question.isRequired,
              orderIndex: question.orderIndex,
              metadataJson: question.metadataJson || undefined,
            },
          });

          // Create options if choice question
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

      // Fetch the created survey with all relations for return payload
      return await tx.survey.findUnique({
        where: { id: newSurvey.id },
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
      throw new Error('Failed to fetch created survey transaction');
    }

    // 5. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SURVEY_CREATED',
      entityType: 'survey',
      entityId: survey.id,
      newValueJson: survey,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Survey built successfully',
      data: {
        survey,
      },
    });
  } catch (error) {
    console.error('Survey POST API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to construct survey' },
      { status: 500 }
    );
  }
}
