import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, StaffStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageStaff } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { createAuditLog } from '@/lib/audit-log';

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
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage staff status.' },
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

    // 4. Validate status in request body
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(StaffStatus).includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing status parameter' },
        { status: 400 }
      );
    }

    const oldStaffValue = { ...existingStaff };

    // 5. Update staff status
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        status: status as StaffStatus,
      },
    });

    // 6. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STAFF_STATUS_CHANGED',
      entityType: 'staff',
      entityId: staffId,
      oldValueJson: oldStaffValue,
      newValueJson: updatedStaff,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member status updated successfully',
      data: {
        staff: updatedStaff,
      },
    });
  } catch (error) {
    console.error('Staff Status PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update staff status' },
      { status: 500 }
    );
  }
}
