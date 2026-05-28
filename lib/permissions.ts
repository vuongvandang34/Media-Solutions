import { UserRole } from '@prisma/client';

export interface PermUser {
  role: UserRole;
  tenantId: string | null;
}

/**
 * BUSINESS_OWNER and MANAGER can create and edit staff.
 */
export function canManageStaff(user: PermUser): boolean {
  return [UserRole.BUSINESS_OWNER, UserRole.MANAGER].includes(user.role);
}

/**
 * BUSINESS_OWNER and MANAGER can create and edit customers.
 */
export function canManageCustomers(user: PermUser): boolean {
  return [UserRole.BUSINESS_OWNER, UserRole.MANAGER].includes(user.role);
}

/**
 * BUSINESS_OWNER and MANAGER can create and edit surveys.
 */
export function canManageSurveys(user: PermUser): boolean {
  return [UserRole.BUSINESS_OWNER, UserRole.MANAGER].includes(user.role);
}

/**
 * Only BUSINESS_OWNER can manage business profile and upload branding.
 */
export function canManageBranding(user: PermUser): boolean {
  return user.role === UserRole.BUSINESS_OWNER;
}

/**
 * Only BUSINESS_OWNER can configure customer fields.
 */
export function canConfigureCustomerFields(user: PermUser): boolean {
  return user.role === UserRole.BUSINESS_OWNER;
}

/**
 * Only BUSINESS_OWNER can delete CRM records permanently or perform soft deletes.
 * MANAGER and STAFF are blocked from deleting important data records.
 */
export function canDeleteCrmRecord(user: PermUser): boolean {
  return user.role === UserRole.BUSINESS_OWNER;
}
