import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, StaffStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageStaff, canDeleteCrmRecord } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { staffSchema } from '@/validations/staff.validation';
import { createAuditLog } from '@/lib/audit-log';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
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

    // 2. Fetch staff member and verify tenant ownership (tenant isolation)
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        staff,
      },
    });
  } catch (error) {
    console.error('Staff detail GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve staff details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
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

    // 2. Require canManageStaff permission
    if (!canManageStaff(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage staff.' },
        { status: 403 }
      );
    }

    // 3. Locate existing staff member and verify tenant ownership
    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!existingStaff || existingStaff.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    // 4. Validate Input
    const body = await req.json();
    const result = staffSchema.safeParse(body);

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

    // 5. Ensure staffCode is unique within this tenant if changed
    if (data.staffCode !== existingStaff.staffCode) {
      const codeConflict = await prisma.staff.findFirst({
        where: {
          tenantId: user.tenantId,
          staffCode: data.staffCode,
          id: { not: staffId },
        },
      });

      if (codeConflict) {
        return NextResponse.json(
          {
            success: false,
            message: 'Conflict error',
            errors: {
              staffCode: ['Staff code is already in use in this workspace'],
            },
          },
          { status: 400 }
        );
      }
    }

    const oldStaffValue = { ...existingStaff };

    // 6. Update database record
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        staffCode: data.staffCode,
        fullName: data.fullName,
        phone: data.phone || null,
        avatarUrl: data.avatarUrl || null,
        status: data.status || existingStaff.status,
      },
    });

    // 7. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STAFF_UPDATED',
      entityType: 'staff',
      entityId: staffId,
      oldValueJson: oldStaffValue,
      newValueJson: updatedStaff,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      data: {
        staff: updatedStaff,
      },
    });
  } catch (error) {
    console.error('Staff PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update staff details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
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

    // 2. Enforce canDeleteCrmRecord (BUSINESS_OWNER only) permission
    if (!canDeleteCrmRecord(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can soft-delete staff members.' },
        { status: 403 }
      );
    }

    // 3. Locate existing staff member and verify tenant ownership
    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!existingStaff || existingStaff.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    const oldStaffValue = { ...existingStaff };

    // 4. Soft-delete staff by setting status = RESIGNED
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        status: StaffStatus.RESIGNED,
      },
    });

    // 5. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STAFF_RESIGNED',
      entityType: 'staff',
      entityId: staffId,
      oldValueJson: oldStaffValue,
      newValueJson: updatedStaff,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member soft-deleted (marked as RESIGNED) successfully',
      data: {
        staff: updatedStaff,
      },
    });
  } catch (error) {
    console.error('Staff DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to soft-delete staff member' },
      { status: 500 }
    );
  }
}
