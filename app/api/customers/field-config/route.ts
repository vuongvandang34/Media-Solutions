import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, CustomerFieldType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canConfigureCustomerFields } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { createAuditLog } from '@/lib/audit-log';

// Default customer fields layout configuration
const DEFAULT_FIELDS = [
  { fieldKey: 'customerCode', fieldLabel: 'Customer Code', fieldType: 'TEXT', isRequired: true, isEnabled: true, orderIndex: 1 },
  { fieldKey: 'name', fieldLabel: 'Full Name', fieldType: 'TEXT', isRequired: true, isEnabled: true, orderIndex: 2 },
  { fieldKey: 'phone', fieldLabel: 'Phone Number', fieldType: 'PHONE', isRequired: true, isEnabled: true, orderIndex: 3 },
  { fieldKey: 'email', fieldLabel: 'Email Address', fieldType: 'EMAIL', isRequired: false, isEnabled: true, orderIndex: 4 },
  { fieldKey: 'birthday', fieldLabel: 'Birthday', fieldType: 'DATE', isRequired: false, isEnabled: true, orderIndex: 5 },
  { fieldKey: 'company', fieldLabel: 'Company Name', fieldType: 'TEXT', isRequired: false, isEnabled: true, orderIndex: 6 },
  { fieldKey: 'website', fieldLabel: 'Website / URL', fieldType: 'URL', isRequired: false, isEnabled: true, orderIndex: 7 },
  { fieldKey: 'address', fieldLabel: 'Physical Address', fieldType: 'TEXTAREA', isRequired: false, isEnabled: true, orderIndex: 8 },
  { fieldKey: 'note', fieldLabel: 'Internal Notes', fieldType: 'TEXTAREA', isRequired: false, isEnabled: true, orderIndex: 9 },
];

const LOCKED_FIELDS = ['customerCode', 'name', 'phone'];

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

    // 1. Fetch current configs
    let configs = await prisma.customerFieldConfig.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { orderIndex: 'asc' },
    });

    // 2. Bootstrap defaults if none exist for this tenant
    if (configs.length === 0) {
      const dataToCreate = DEFAULT_FIELDS.map((f) => ({
        tenantId: user.tenantId!,
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType as CustomerFieldType,
        isRequired: f.isRequired,
        isEnabled: f.isEnabled,
        orderIndex: f.orderIndex,
      }));

      await prisma.customerFieldConfig.createMany({
        data: dataToCreate,
      });

      configs = await prisma.customerFieldConfig.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { orderIndex: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer field configurations retrieved successfully',
      data: {
        fields: configs,
      },
    });
  } catch (error) {
    console.error('Customer Field Config GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve customer field configs' },
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

    // 2. Enforce canConfigureCustomerFields (BUSINESS_OWNER only) permission
    if (!canConfigureCustomerFields(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can configure customer fields.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fields } = body;

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid fields array parameters' },
        { status: 400 }
      );
    }

    // Load current database configurations for comparison
    const currentConfigs = await prisma.customerFieldConfig.findMany({
      where: { tenantId: user.tenantId },
    });

    const currentConfigsMap = new Map(currentConfigs.map((c) => [c.fieldKey, c]));

    // 3. Validate business rules for each updated field
    for (const field of fields) {
      const { fieldKey, isEnabled, isRequired } = field;

      const current = currentConfigsMap.get(fieldKey);
      if (!current) {
        return NextResponse.json(
          { success: false, message: `Field key ${fieldKey} is invalid` },
          { status: 400 }
        );
      }

      // Rule: Locked fields (customerCode, name, phone) cannot be disabled or made optional
      if (LOCKED_FIELDS.includes(fieldKey)) {
        if (isEnabled === false || isRequired === false) {
          return NextResponse.json(
            {
              success: false,
              message: `Locked fields (${LOCKED_FIELDS.join(', ')}) must always be enabled and required.`,
            },
            { status: 400 }
          );
        }
      }

      // Rule: Disabled fields cannot be marked as required
      if (isEnabled === false && isRequired === true) {
        return NextResponse.json(
          {
            success: false,
            message: `Field ${fieldKey} cannot be disabled and required simultaneously.`,
          },
          { status: 400 }
        );
      }
    }

    const oldConfigsValue = JSON.parse(JSON.stringify(currentConfigs));

    // 4. Update configurations inside a database transaction
    const updatePromises = fields.map((f) =>
      prisma.customerFieldConfig.update({
        where: {
          tenantId_fieldKey: {
            tenantId: user.tenantId!,
            fieldKey: f.fieldKey,
          },
        },
        data: {
          fieldLabel: f.fieldLabel !== undefined ? f.fieldLabel : undefined,
          isEnabled: f.isEnabled !== undefined ? f.isEnabled : undefined,
          isRequired: f.isRequired !== undefined ? f.isRequired : undefined,
          orderIndex: f.orderIndex !== undefined ? f.orderIndex : undefined,
        },
      })
    );

    const updatedConfigs = await prisma.$transaction(updatePromises);

    // 5. Register audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_FIELD_CONFIG_UPDATED',
      entityType: 'customerFieldConfig',
      oldValueJson: oldConfigsValue,
      newValueJson: updatedConfigs,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Customer fields configuration updated successfully',
      data: {
        fields: updatedConfigs,
      },
    });
  } catch (error) {
    console.error('Customer Field Config PATCH API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer field configurations' },
      { status: 500 }
    );
  }
}
