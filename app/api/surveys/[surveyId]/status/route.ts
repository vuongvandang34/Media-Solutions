import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, SurveyStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageSurveys } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { createAuditLog } from '@/lib/audit-log';

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
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage survey status.' },
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

    // 4. Validate status in request body
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(SurveyStatus).includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing status parameter' },
        { status: 400 }
      );
    }

    const oldSurveyValue = { ...existingSurvey };

    // 5. Update survey status
    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        status: status as SurveyStatus,
      },
    });

    // 6. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SURVEY_STATUS_CHANGED',
      entityType: 'survey',
      entityId: surveyId,
      oldValueJson: oldSurveyValue,
      newValueJson: updatedSurvey,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Survey status updated successfully',
      data: {
        survey: updatedSurvey,
      },
    });
  } catch (error) {
    console.error('Survey Status PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update survey status' },
      { status: 500 }
    );
  }
}
