import { prisma } from './prisma';

interface AuditLogInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValueJson?: any;
  newValueJson?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId || null,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        oldValueJson: input.oldValueJson ? JSON.parse(JSON.stringify(input.oldValueJson)) : undefined,
        newValueJson: input.newValueJson ? JSON.parse(JSON.stringify(input.newValueJson)) : undefined,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Fail silently to prevent breaking primary transaction flows
  }
}
