import { NextResponse } from 'next/server';
import { loginSchema } from '@/validations/auth.validation';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';
import { UserStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password, captchaCode } = result.data;

    // 1. Locate user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const now = new Date();

    // 2. Check lock status
    if (user.lockedUntil && user.lockedUntil > now) {
      return NextResponse.json(
        { error: 'Your account is temporarily locked. Please try again later.' },
        { status: 423 }
      );
    }

    // 3. Check pending verification
    if (user.status === UserStatus.PENDING) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 }
      );
    }

    // 4. Check locked or disabled state (if not unlocked by expiration above)
    if (user.status === UserStatus.DISABLED) {
      return NextResponse.json(
        { error: 'Your account is locked. Please contact support.' },
        { status: 403 }
      );
    }

    // 5. Captcha Verification (if required)
    if (user.captchaRequired) {
      if (!captchaCode) {
        return NextResponse.json(
          { error: 'Captcha code is required.', captchaRequired: true },
          { status: 400 }
        );
      }
      if (captchaCode !== '1234') {
        return NextResponse.json(
          { error: 'Invalid captcha code.', captchaRequired: true },
          { status: 400 }
        );
      }
    }

    // 6. Verify password
    const isPasswordCorrect = await comparePassword(password, user.passwordHash);

    if (!isPasswordCorrect) {
      const nextFailedAttempts = user.failedLoginAttempts + 1;
      let updateData: any = {
        failedLoginAttempts: nextFailedAttempts,
      };

      if (nextFailedAttempts >= 4) {
        updateData.captchaRequired = true;
      }

      if (nextFailedAttempts >= 5) {
        updateData.status = UserStatus.LOCKED;
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Audit Log for authentication failure
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });

      if (nextFailedAttempts >= 5) {
        return NextResponse.json(
          { error: 'Your account is temporarily locked. Please try again later.' },
          { status: 423 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          captchaRequired: nextFailedAttempts >= 4,
        },
        { status: 400 }
      );
    }

    // 7. Successful Authentication
    let statusUpdate = user.status;
    if (user.status === UserStatus.LOCKED) {
      statusUpdate = UserStatus.ACTIVE; // Auto-unlock if lock expired
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        captchaRequired: false,
        lockedUntil: null,
        status: statusUpdate,
        lastLoginAt: now,
      },
    });

    // 8. Create JWT Session
    await createSession({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
    });

    // 9. Create Audit Log
    await createAuditLog({
      tenantId: updatedUser.tenantId,
      userId: updatedUser.id,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: updatedUser.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId,
        tenantStatus: user.tenant?.status || null,
      },
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
