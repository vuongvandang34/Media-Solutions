import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/validations/auth.validation';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { createAuditLog } from '@/lib/audit-log';
import { UserStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { token, password, confirmPassword } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: result.error.format() },
        { status: 400 }
      );
    }

    // 1. Locate the user by token
    const user = await prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // 2. Check token expiration
    if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // 3. Hash password and update user record
    const passwordHash = await hashPassword(password);

    let statusUpdate = user.status;
    if (user.status === UserStatus.LOCKED) {
      statusUpdate = UserStatus.ACTIVE; // Unlock if locked due to failed logins
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        failedLoginAttempts: 0,
        captchaRequired: false,
        lockedUntil: null,
        status: statusUpdate,
      },
    });

    // 4. Create Audit Log
    await createAuditLog({
      tenantId: updatedUser.tenantId,
      userId: updatedUser.id,
      action: 'AUTH_RESET_PASSWORD',
      entityType: 'user',
      entityId: updatedUser.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ message: 'Password has been reset successfully!' });
  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during password reset' },
      { status: 500 }
    );
  }
}
