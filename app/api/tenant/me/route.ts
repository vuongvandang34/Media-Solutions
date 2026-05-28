import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageBranding } from '@/lib/permissions';
import { tenantProfileSchema } from '@/validations/tenant.validation';
import { assertTenantActive } from '@/lib/tenant';
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

    if (user.role === UserRole.PLATFORM_OWNER) {
      return NextResponse.json(
        { success: false, message: 'Platform administrators do not possess a single tenant context.' },
        { status: 400 }
      );
    }

    if (!user.tenantId || !user.tenant) {
      return NextResponse.json(
        { success: false, message: 'No tenant found associated with user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: user.tenant.id,
          tenantCode: user.tenant.tenantCode,
          businessName: user.tenant.businessName,
          businessAddress: user.tenant.businessAddress,
          country: user.tenant.country,
          ownerName: user.tenant.ownerName,
          ownerEmail: user.tenant.ownerEmail,
          ownerPhone: user.tenant.ownerPhone,
          status: user.tenant.status,
          plan: user.tenant.plan,
          logoUrl: user.tenant.logoUrl,
          promotionPhotoUrl: user.tenant.promotionPhotoUrl,
          subscriptionStartAt: user.tenant.subscriptionStartAt,
          subscriptionEndAt: user.tenant.subscriptionEndAt,
        },
      },
    });
  } catch (error) {
    console.error('Tenant Me GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve tenant context' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId || !user.tenant) {
      return NextResponse.json(
        { success: false, message: 'No tenant scope associated with user' },
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

    // 2. Require canManageBranding (BUSINESS_OWNER) permission
    if (!canManageBranding(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can manage the business profile.' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await req.json();
    const result = tenantProfileSchema.safeParse(body);

    if (!result.success) {
      const formattedErrors: Record<string, string[]> = {};
      for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
        formattedErrors[key] = val || [];
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input fields',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const oldTenantData = {
      businessName: user.tenant.businessName,
      businessAddress: user.tenant.businessAddress,
      country: user.tenant.country,
      ownerName: user.tenant.ownerName,
      ownerPhone: user.tenant.ownerPhone,
    };

    // 4. Perform database update
    const updatedTenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        country: data.country,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
      },
    });

    // 5. Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'TENANT_PROFILE_UPDATED',
      entityType: 'tenant',
      entityId: user.tenantId,
      oldValueJson: oldTenantData,
      newValueJson: {
        businessName: updatedTenant.businessName,
        businessAddress: updatedTenant.businessAddress,
        country: updatedTenant.country,
        ownerName: updatedTenant.ownerName,
        ownerPhone: updatedTenant.ownerPhone,
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Business profile updated successfully',
      data: {
        tenant: updatedTenant,
      },
    });
  } catch (error) {
    console.error('Tenant Me PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}

