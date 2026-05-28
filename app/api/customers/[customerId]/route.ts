import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, CustomerStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageCustomers, canDeleteCrmRecord } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { customerSchema } from '@/validations/customer.validation';
import { createAuditLog } from '@/lib/audit-log';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
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

    // 1. Fetch customer and enforce tenant isolation
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    console.error('Customer GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve customer details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
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
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can edit customers.' },
        { status: 403 }
      );
    }

    // 3. Locate existing customer and verify tenant ownership
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer || existingCustomer.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // 4. Load dynamic Customer Field Config to validate active rules
    const fieldConfigs = await prisma.customerFieldConfig.findMany({
      where: { tenantId: user.tenantId, isEnabled: true },
    });

    const requiredFieldKeys = fieldConfigs.filter((f) => f.isRequired).map((f) => f.fieldKey);

    const body = await req.json();

    // 5. Validate input fields using static Zod schema
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

    // 6. Enforce dynamic required validations
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

    // 7. Ensure customerCode is unique within tenant if changed
    if (data.customerCode !== existingCustomer.customerCode) {
      const codeConflict = await prisma.customer.findFirst({
        where: {
          tenantId: user.tenantId,
          customerCode: data.customerCode,
          id: { not: customerId },
        },
      });

      if (codeConflict) {
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
    }

    let birthdayDate: Date | null = null;
    if (data.birthday) {
      birthdayDate = new Date(data.birthday);
    }

    const oldCustomerValue = { ...existingCustomer };

    // 8. Update database record
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        customerCode: data.customerCode,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        birthday: birthdayDate,
        website: data.website || null,
        company: data.company || null,
        address: data.address || null,
        note: data.note || null,
        status: data.status || existingCustomer.status,
      },
    });

    // 9. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_UPDATED',
      entityType: 'customer',
      entityId: customerId,
      oldValueJson: oldCustomerValue,
      newValueJson: updatedCustomer,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    console.error('Customer PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
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
        { success: false, message: 'Forbidden. Only the Business Owner can soft-delete customer records.' },
        { status: 403 }
      );
    }

    // 3. Locate existing customer and verify tenant ownership
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer || existingCustomer.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const oldCustomerValue = { ...existingCustomer };

    // 4. Soft delete customer by setting status = LOCKED
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        status: CustomerStatus.LOCKED,
      },
    });

    // 5. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_LOCKED',
      entityType: 'customer',
      entityId: customerId,
      oldValueJson: oldCustomerValue,
      newValueJson: updatedCustomer,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Customer soft-deleted (marked as LOCKED) successfully',
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    console.error('Customer DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to soft-delete customer record' },
      { status: 500 }
    );
  }
}
