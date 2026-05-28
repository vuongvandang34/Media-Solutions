import { NextResponse } from 'next/server';
import { destroySession, getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (user) {
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'AUTH_LOGOUT',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });
    }

    await destroySession();
    return NextResponse.json({ message: 'Logged out successfully!' });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
