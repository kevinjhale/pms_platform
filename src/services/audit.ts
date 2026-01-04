import { getDb, auditLogs } from "@/db";
import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { generateId, now } from "@/lib/utils";
import type { AuditAction, AuditEntityType, AuditLog } from "@/db/schema/audit";

export interface AuditContext {
  userId?: string | null;
  userEmail?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditEntry {
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// ============ CORE LOGGING ============

export async function logAudit(
  context: AuditContext,
  entry: AuditEntry
): Promise<void> {
  const db = getDb();
  const id = generateId();

  await db.insert(auditLogs).values({
    id,
    userId: context.userId || null,
    userEmail: context.userEmail || null,
    organizationId: context.organizationId || null,
    action: entry.action,
    entityType: entry.entityType || null,
    entityId: entry.entityId || null,
    description: entry.description,
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null,
    createdAt: now(),
  });
}

// Convenience function for auth events (no org context)
export async function logAuthEvent(
  action: "auth.login" | "auth.logout" | "auth.failed_login",
  userEmail: string,
  context: Partial<AuditContext> = {},
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit(
    { ...context, userEmail },
    {
      action,
      entityType: "user",
      description:
        action === "auth.login"
          ? `User ${userEmail} logged in`
          : action === "auth.logout"
          ? `User ${userEmail} logged out`
          : `Failed login attempt for ${userEmail}`,
      metadata,
    }
  );
}

// ============ ENTITY-SPECIFIC HELPERS ============

export async function logPropertyAction(
  context: AuditContext,
  action: "property.created" | "property.updated" | "property.deleted",
  propertyId: string,
  propertyName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const descriptions: Record<typeof action, string> = {
    "property.created": `Created property "${propertyName}"`,
    "property.updated": `Updated property "${propertyName}"`,
    "property.deleted": `Deleted property "${propertyName}"`,
  };

  await logAudit(context, {
    action,
    entityType: "property",
    entityId: propertyId,
    description: descriptions[action],
    metadata,
  });
}

export async function logUnitAction(
  context: AuditContext,
  action: "unit.created" | "unit.updated" | "unit.deleted",
  unitId: string,
  unitNumber: string,
  propertyName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const descriptions: Record<typeof action, string> = {
    "unit.created": `Created unit ${unitNumber} at "${propertyName}"`,
    "unit.updated": `Updated unit ${unitNumber} at "${propertyName}"`,
    "unit.deleted": `Deleted unit ${unitNumber} from "${propertyName}"`,
  };

  await logAudit(context, {
    action,
    entityType: "unit",
    entityId: unitId,
    description: descriptions[action],
    metadata,
  });
}

export async function logApplicationAction(
  context: AuditContext,
  action:
    | "application.submitted"
    | "application.reviewed"
    | "application.approved"
    | "application.rejected"
    | "application.withdrawn",
  applicationId: string,
  applicantName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const descriptions: Record<typeof action, string> = {
    "application.submitted": `${applicantName} submitted an application`,
    "application.reviewed": `Reviewed application from ${applicantName}`,
    "application.approved": `Approved application from ${applicantName}`,
    "application.rejected": `Rejected application from ${applicantName}`,
    "application.withdrawn": `${applicantName} withdrew their application`,
  };

  await logAudit(context, {
    action,
    entityType: "application",
    entityId: applicationId,
    description: descriptions[action],
    metadata,
  });
}

export async function logLeaseAction(
  context: AuditContext,
  action:
    | "lease.created"
    | "lease.updated"
    | "lease.activated"
    | "lease.terminated"
    | "lease.renewed",
  leaseId: string,
  tenantName: string,
  unitInfo: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const descriptions: Record<typeof action, string> = {
    "lease.created": `Created lease for ${tenantName} at ${unitInfo}`,
    "lease.updated": `Updated lease for ${tenantName} at ${unitInfo}`,
    "lease.activated": `Activated lease for ${tenantName} at ${unitInfo}`,
    "lease.terminated": `Terminated lease for ${tenantName} at ${unitInfo}`,
    "lease.renewed": `Renewed lease for ${tenantName} at ${unitInfo}`,
  };

  await logAudit(context, {
    action,
    entityType: "lease",
    entityId: leaseId,
    description: descriptions[action],
    metadata,
  });
}

export async function logPaymentAction(
  context: AuditContext,
  action: "payment.recorded" | "payment.voided" | "late_fee.applied" | "late_fee.waived",
  paymentId: string,
  amount: number, // in cents
  tenantName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const amountStr = `$${(amount / 100).toLocaleString()}`;
  const descriptions: Record<typeof action, string> = {
    "payment.recorded": `Recorded payment of ${amountStr} from ${tenantName}`,
    "payment.voided": `Voided payment of ${amountStr} from ${tenantName}`,
    "late_fee.applied": `Applied late fee of ${amountStr} to ${tenantName}`,
    "late_fee.waived": `Waived late fee of ${amountStr} for ${tenantName}`,
  };

  await logAudit(context, {
    action,
    entityType: "payment",
    entityId: paymentId,
    description: descriptions[action],
    metadata,
  });
}

export async function logMaintenanceAction(
  context: AuditContext,
  action:
    | "maintenance.created"
    | "maintenance.updated"
    | "maintenance.assigned"
    | "maintenance.completed"
    | "maintenance.cancelled"
    | "maintenance.comment_added",
  requestId: string,
  title: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const descriptions: Record<typeof action, string> = {
    "maintenance.created": `Created maintenance request: "${title}"`,
    "maintenance.updated": `Updated maintenance request: "${title}"`,
    "maintenance.assigned": `Assigned maintenance request: "${title}"`,
    "maintenance.completed": `Completed maintenance request: "${title}"`,
    "maintenance.cancelled": `Cancelled maintenance request: "${title}"`,
    "maintenance.comment_added": `Added comment to maintenance request: "${title}"`,
  };

  await logAudit(context, {
    action,
    entityType: "maintenance",
    entityId: requestId,
    description: descriptions[action],
    metadata,
  });
}

// ============ QUERY FUNCTIONS ============

export interface AuditQueryParams {
  organizationId?: string;
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(params: AuditQueryParams): Promise<AuditLog[]> {
  const db = getDb();
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  // Build conditions array
  const conditions = [];

  if (params.organizationId) {
    conditions.push(eq(auditLogs.organizationId, params.organizationId));
  }
  if (params.userId) {
    conditions.push(eq(auditLogs.userId, params.userId));
  }
  if (params.entityType) {
    conditions.push(eq(auditLogs.entityType, params.entityType));
  }
  if (params.entityId) {
    conditions.push(eq(auditLogs.entityId, params.entityId));
  }
  if (params.action) {
    conditions.push(eq(auditLogs.action, params.action));
  }
  if (params.startDate) {
    conditions.push(gte(auditLogs.createdAt, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(auditLogs.createdAt, params.endDate));
  }

  const query = db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

export async function getAuditLogsByEntity(
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditLog[]> {
  const db = getDb();

  return db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt));
}

export async function getRecentActivityForOrg(
  organizationId: string,
  limit = 20
): Promise<AuditLog[]> {
  const db = getDb();

  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============ CONTEXT BUILDER ============

// Build audit context from session and org
export function buildAuditContext(
  session: { user?: { id?: string; email?: string | null } } | null,
  organizationId?: string | null
): AuditContext {
  return {
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    organizationId: organizationId || null,
    // IP and user agent would typically come from request headers
    // These can be added by the caller if available
  };
}

// ============ UTILITY ============

// Parse stored metadata back to object
export function parseAuditMetadata(log: AuditLog): Record<string, unknown> | null {
  if (!log.metadata) return null;
  try {
    return JSON.parse(log.metadata);
  } catch {
    return null;
  }
}

// Get human-readable action label
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    "auth.login": "Logged in",
    "auth.logout": "Logged out",
    "auth.failed_login": "Failed login",
    "user.created": "User created",
    "user.updated": "User updated",
    "user.deleted": "User deleted",
    "user.role_changed": "Role changed",
    "org.created": "Organization created",
    "org.updated": "Organization updated",
    "org.member_added": "Member added",
    "org.member_removed": "Member removed",
    "property.created": "Property created",
    "property.updated": "Property updated",
    "property.deleted": "Property deleted",
    "unit.created": "Unit created",
    "unit.updated": "Unit updated",
    "unit.deleted": "Unit deleted",
    "application.submitted": "Application submitted",
    "application.reviewed": "Application reviewed",
    "application.approved": "Application approved",
    "application.rejected": "Application rejected",
    "application.withdrawn": "Application withdrawn",
    "lease.created": "Lease created",
    "lease.updated": "Lease updated",
    "lease.activated": "Lease activated",
    "lease.terminated": "Lease terminated",
    "lease.renewed": "Lease renewed",
    "payment.recorded": "Payment recorded",
    "payment.voided": "Payment voided",
    "late_fee.applied": "Late fee applied",
    "late_fee.waived": "Late fee waived",
    "maintenance.created": "Request created",
    "maintenance.updated": "Request updated",
    "maintenance.assigned": "Request assigned",
    "maintenance.completed": "Request completed",
    "maintenance.cancelled": "Request cancelled",
    "maintenance.comment_added": "Comment added",
    "document.uploaded": "Document uploaded",
    "document.deleted": "Document deleted",
    "document.accessed": "Document accessed",
    "settings.updated": "Settings updated",
    "export.requested": "Export requested",
  };

  return labels[action] || action;
}
