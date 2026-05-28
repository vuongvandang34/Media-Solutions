import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/validations/auth.validation';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';
import { createAuditLog } from '@/lib/audit-log';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const genericResponse = {
      message: 'If this email exists, a reset link has been sent.',
    };

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return generic success to avoid user harvesting
      return NextResponse.json(genericResponse);
    }

    // 2. Generate and save reset token
    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordTokenExpiresAt,
      },
    });

    // 3. Dispatch recovery email
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetPasswordToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset your Feedback CRM password',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            We received a request to reset your password. Click the button below to choose a new one:
          </p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser: <br/>
            <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            If you did not request this, you can safely ignore this email. The link will expire in 1 hour.
          </p>
        </div>
      `,
      text: `Reset your Feedback CRM password by visiting: ${resetUrl}`,
    });

    // 4. Create Audit Log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'AUTH_FORGOT_PASSWORD',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during password recovery' },
      { status: 500 }
    );
  }
}
