import { getCurrentUser } from './auth';
import { prisma } from './prisma';
import { TenantStatus, UserRole } from '@prisma/client';

export async function getCurrentTenant() {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) return null;
  return user.tenant;
}

export async function assertTenantActive() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  // PLATFORM_OWNER is a global admin and bypasses tenant constraints
  if (user.role === UserRole.PLATFORM_OWNER) {
    return true;
  }

  if (!user.tenantId || !user.tenant) {
    throw new Error('No tenant associated with user');
  }

  const tenant = user.tenant;

  // Automatic subscription expiry check
  if (tenant.subscriptionEndAt && new Date(tenant.subscriptionEndAt) < new Date()) {
    if (tenant.status !== TenantStatus.EXPIRED) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: TenantStatus.EXPIRED },
      });
      tenant.status = TenantStatus.EXPIRED;
    }
  }

  if (tenant.status !== TenantStatus.ACTIVE) {
    throw new Error(`Tenant is not active. Current status: ${tenant.status}`);
  }

  return true;
}

export function tenantWhere(user: { role: UserRole; tenantId: string | null }) {
  if (user.role === UserRole.PLATFORM_OWNER) {
    return {}; // Can access all data
  }

  if (!user.tenantId) {
    throw new Error('Tenant ID required for scoped query context');
  }

  return { tenantId: user.tenantId };
}
