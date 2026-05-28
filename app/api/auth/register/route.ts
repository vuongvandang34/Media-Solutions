import { NextResponse } from 'next/server';
import { registerSchema } from '@/validations/auth.validation';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { sendEmail } from '@/lib/mail';
import { createAuditLog } from '@/lib/audit-log';
import { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      businessName,
      businessAddress,
      country,
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
    } = result.data;

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // 2. Locate Trial plan
    const trialPlan = await prisma.plan.findUnique({
      where: { name: 'Trial' },
    });

    if (!trialPlan) {
      return NextResponse.json(
        { error: 'Trial subscription plan not configured. Please run seeds.' },
        { status: 500 }
      );
    }

    // 3. Generate a unique tenant code
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tenantCode = `${baseSlug}-${randomSuffix}`;

    // 4. Perform database creation
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode,
        businessName,
        businessAddress,
        country,
        ownerName,
        ownerEmail,
        ownerPhone,
        status: TenantStatus.PENDING,
        planId: trialPlan.id,
        subscriptionStartAt: new Date(),
        subscriptionEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    });

    const passwordHash = await hashPassword(password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        fullName: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
        status: UserStatus.PENDING,
        emailVerificationToken,
        emailVerificationTokenExpiresAt,
      },
    });

    // 5. Send verification email
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${emailVerificationToken}`;

    await sendEmail({
      to: ownerEmail,
      subject: 'Verify your Feedback CRM account',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to Business Feedback CRM!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            Thank you for registering your business, <strong>${businessName}</strong>. Please click the button below to verify your email and activate your account:
          </p>
          <div style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser: <br/>
            <a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            This verification link will expire in 24 hours.
          </p>
        </div>
      `,
      text: `Welcome to Business Feedback CRM! Verify your account by visiting: ${verifyUrl}`,
    });

    // 6. Create Audit Log
    await createAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: 'AUTH_REGISTER',
      entityType: 'tenant',
      entityId: tenant.id,
      newValueJson: { tenantCode, businessName, ownerEmail },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
