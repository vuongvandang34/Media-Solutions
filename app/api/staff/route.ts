import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, StaffStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageStaff } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { assertCanCreateStaff } from '@/lib/plan-limits';
import { staffSchema } from '@/validations/staff.validation';
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

    // Extract search query, status filter, and pagination
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build Prisma query clauses
    const whereClause: any = {
      tenantId: user.tenantId,
    };

    if (status) {
      whereClause.status = status as StaffStatus;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { staffCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch total count and paginated items in parallel
    const [total, items] = await Promise.all([
      prisma.staff.count({ where: whereClause }),
      prisma.staff.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Staff list retrieved successfully',
      data: {
        items,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Staff GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve staff list' },
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

    // 2. Require canManageStaff permission
    if (!canManageStaff(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage staff.' },
        { status: 403 }
      );
    }

    // 3. Enforce Plan Limits (maxStaff)
    try {
      await assertCanCreateStaff(user.tenantId);
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message || 'Plan limit exceeded' },
        { status: 403 }
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

    // 5. Ensure staffCode is unique within this tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        tenantId: user.tenantId,
        staffCode: data.staffCode,
      },
    });

    if (existingStaff) {
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

    // 6. Create Staff record
    const staff = await prisma.staff.create({
      data: {
        tenantId: user.tenantId,
        staffCode: data.staffCode,
        fullName: data.fullName,
        phone: data.phone || null,
        avatarUrl: data.avatarUrl || null,
        status: data.status || StaffStatus.ACTIVE,
      },
    });

    // 7. Create Audit Log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STAFF_CREATED',
      entityType: 'staff',
      entityId: staff.id,
      newValueJson: staff,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        staff,
      },
    });
  } catch (error) {
    console.error('Staff POST API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
