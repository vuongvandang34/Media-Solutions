import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { assertTenantActive } from '@/lib/tenant';

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

    const body = await req.json();
    const { phone, email, excludeCustomerId } = body;

    let phoneExists = false;
    let emailExists = false;
    const matchedCustomers: any[] = [];

    // 2. Perform duplicate check within tenant
    if (phone) {
      const match = await prisma.customer.findFirst({
        where: {
          tenantId: user.tenantId,
          phone,
          id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
        },
      });
      if (match) {
        phoneExists = true;
        matchedCustomers.push(match);
      }
    }

    if (email) {
      const match = await prisma.customer.findFirst({
        where: {
          tenantId: user.tenantId,
          email,
          id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
        },
      });
      if (match) {
        emailExists = true;
        // Avoid adding twice if matches both
        if (!matchedCustomers.some((c) => c.id === match.id)) {
          matchedCustomers.push(match);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Duplicate checking completed',
      data: {
        phoneExists,
        emailExists,
        matchedCustomers,
      },
    });
  } catch (error) {
    console.error('Customer Check Duplicate API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check customer duplicates' },
      { status: 500 }
    );
  }
}
