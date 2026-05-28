import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { TenantStatus, UserStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // 1. Locate the user with the matching token
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // 2. Check token expiration
    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    // 3. Perform atomic updates for user and tenant
    await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });

      // Update related Tenant
      if (user.tenantId) {
        await tx.tenant.update({
          where: { id: user.tenantId },
          data: {
            status: TenantStatus.ACTIVE,
          },
        });
      }
    });

    // 4. Create Audit Log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'AUTH_VERIFY_EMAIL',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Email Verification API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during email verification' },
      { status: 500 }
    );
  }
}
