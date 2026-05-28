import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, CustomerStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageCustomers } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { customerSchema } from '@/validations/customer.validation';
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId: user.tenantId,
    };

    if (status) {
      whereClause.status = status as CustomerStatus;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.customer.count({ where: whereClause }),
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        items,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Customers GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve customers list' },
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

    // 2. Require canManageCustomers permission
    if (!canManageCustomers(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage customers.' },
        { status: 403 }
      );
    }

    // 3. Load dynamic Customer Field Config to validate active rules
    const fieldConfigs = await prisma.customerFieldConfig.findMany({
      where: { tenantId: user.tenantId, isEnabled: true },
    });

    const requiredFieldKeys = fieldConfigs.filter((f) => f.isRequired).map((f) => f.fieldKey);

    const body = await req.json();

    // 4. Validate body using static Zod schema first
    const result = customerSchema.safeParse(body);

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

    // 5. Enforce custom dynamic required validations
    const dynamicErrors: Record<string, string[]> = {};
    for (const reqKey of requiredFieldKeys) {
      const value = (data as any)[reqKey];
      if (value === undefined || value === null || value === '') {
        const config = fieldConfigs.find((f) => f.fieldKey === reqKey);
        dynamicErrors[reqKey] = [`${config?.fieldLabel || reqKey} is a required field`];
      }
    }

    if (Object.keys(dynamicErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Required field configuration mismatch',
          errors: dynamicErrors,
        },
        { status: 400 }
      );
    }

    // 6. Ensure customerCode is unique within tenant
    const existingCode = await prisma.customer.findFirst({
      where: {
        tenantId: user.tenantId,
        customerCode: data.customerCode,
      },
    });

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Conflict error',
          errors: {
            customerCode: ['Customer code is already in use in this workspace'],
          },
        },
        { status: 400 }
      );
    }

    // 7. Parse date if birthday is present
    let birthdayDate: Date | null = null;
    if (data.birthday) {
      birthdayDate = new Date(data.birthday);
    }

    // 8. Create Customer record in database
    const customer = await prisma.customer.create({
      data: {
        tenantId: user.tenantId,
        customerCode: data.customerCode,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        birthday: birthdayDate,
        website: data.website || null,
        company: data.company || null,
        address: data.address || null,
        note: data.note || null,
        status: data.status || CustomerStatus.ACTIVE,
      },
    });

    // 9. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_CREATED',
      entityType: 'customer',
      entityId: customer.id,
      newValueJson: customer,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer,
      },
    });
  } catch (error) {
    console.error('Customer POST API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register customer' },
      { status: 500 }
    );
  }
}
