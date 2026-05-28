import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Platform owners do not have a single tenant scope
    if (user.role === UserRole.PLATFORM_OWNER) {
      return NextResponse.json(
        { error: 'Platform administrators do not possess a single tenant context.' },
        { status: 400 }
      );
    }

    if (!user.tenantId || !user.tenant) {
      return NextResponse.json({ error: 'No tenant found associated with user' }, { status: 404 });
    }

    return NextResponse.json({
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
        subscriptionStartAt: user.tenant.subscriptionStartAt,
        subscriptionEndAt: user.tenant.subscriptionEndAt,
      },
    });
  } catch (error) {
    console.error('Tenant Me API Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve tenant context' }, { status: 500 });
  }
}
