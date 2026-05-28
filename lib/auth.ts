import { cookies } from 'next/headers';
import { verifyJWT, signJWT, JWTPayload } from './jwt';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function createSession(user: { id: string; email: string; role: string; tenantId: string | null }) {
  const token = signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function getSessionPayload(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyJWT(token);
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const payload = await getSessionPayload();
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        tenantId: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            tenantCode: true,
            businessName: true,
            businessAddress: true,
            country: true,
            ownerName: true,
            ownerEmail: true,
            ownerPhone: true,
            status: true,
            subscriptionStartAt: true,
            subscriptionEndAt: true,
            logoUrl: true,
            promotionPhotoUrl: true,
            plan: {
              select: {
                id: true,
                name: true,
                displayName: true,
                maxStaff: true,
                maxMonthlySurveyResponses: true,
                allowTelegramAlert: true,
                allowMultiLanguage: true,
                allowPromotionPhoto: true,
                allowAiTranslation: true,
                allowAiCrisisChatbot: true,
                priceMonthly: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    // If user attempts accessing role-unauthorized page, redirect back to their proper base
    redirect(user.role === UserRole.PLATFORM_OWNER ? '/super-admin' : '/dashboard');
  }
  return user;
}

export async function requireTenantAccess(tenantId: string) {
  const user = await requireAuth();
  if (user.role === UserRole.PLATFORM_OWNER) {
    return true;
  }
  if (user.tenantId !== tenantId) {
    throw new Error('Unauthorized tenant access');
  }
  return true;
}
