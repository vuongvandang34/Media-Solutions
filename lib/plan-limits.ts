import { prisma } from './prisma';

/**
 * Retrieves the subscription plan limits for a specific tenant.
 */
export async function getTenantPlanLimits(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return {
    maxStaff: tenant.plan?.maxStaff ?? 2,
    allowPromotionPhoto: tenant.plan?.allowPromotionPhoto ?? false,
    planName: tenant.plan?.displayName ?? 'Trial',
  };
}

/**
 * Asserts that the tenant is allowed to create another staff member under their plan limits.
 * Excludes resigned staff from the active plan limit count.
 */
export async function assertCanCreateStaff(tenantId: string) {
  const limits = await getTenantPlanLimits(tenantId);

  const currentStaffCount = await prisma.staff.count({
    where: {
      tenantId,
      status: { not: 'RESIGNED' },
    },
  });

  if (currentStaffCount >= limits.maxStaff) {
    throw new Error('Your current plan has reached the staff limit. Please upgrade your plan.');
  }

  return true;
}

/**
 * Asserts that the tenant is allowed to use and upload a promotion photo.
 */
export async function assertCanUsePromotionPhoto(tenantId: string) {
  const limits = await getTenantPlanLimits(tenantId);

  if (!limits.allowPromotionPhoto) {
    throw new Error('Promotion photo is not available on your current plan.');
  }

  return true;
}
