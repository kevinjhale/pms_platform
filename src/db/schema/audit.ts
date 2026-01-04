import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { organizations } from "./organizations";

// Audit log table for compliance tracking
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),

  // Who performed the action
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email"), // Stored separately in case user is deleted

  // Organization context (for multi-tenant queries)
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "set null" }),

  // What action was performed
  action: text("action", {
    enum: [
      // Auth events
      "auth.login",
      "auth.logout",
      "auth.failed_login",

      // User management
      "user.created",
      "user.updated",
      "user.deleted",
      "user.role_changed",

      // Organization management
      "org.created",
      "org.updated",
      "org.member_added",
      "org.member_removed",

      // Property management
      "property.created",
      "property.updated",
      "property.deleted",
      "unit.created",
      "unit.updated",
      "unit.deleted",

      // Application workflow
      "application.submitted",
      "application.reviewed",
      "application.approved",
      "application.rejected",
      "application.withdrawn",

      // Lease management
      "lease.created",
      "lease.updated",
      "lease.activated",
      "lease.terminated",
      "lease.renewed",

      // Rent/Payments
      "payment.recorded",
      "payment.voided",
      "late_fee.applied",
      "late_fee.waived",

      // Maintenance
      "maintenance.created",
      "maintenance.updated",
      "maintenance.assigned",
      "maintenance.completed",
      "maintenance.cancelled",
      "maintenance.comment_added",

      // Documents (future)
      "document.uploaded",
      "document.deleted",
      "document.accessed",

      // Settings/Admin
      "settings.updated",
      "export.requested",
    ],
  }).notNull(),

  // What entity was affected
  entityType: text("entity_type", {
    enum: [
      "user",
      "organization",
      "property",
      "unit",
      "application",
      "lease",
      "payment",
      "maintenance",
      "document",
      "settings",
    ],
  }),
  entityId: text("entity_id"),

  // Human-readable description
  description: text("description").notNull(),

  // Additional context as JSON (old/new values, metadata)
  metadata: text("metadata"), // JSON string

  // Request context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Timestamp
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Audit action types for type safety
export type AuditAction = NonNullable<AuditLog["action"]>;
export type AuditEntityType = NonNullable<AuditLog["entityType"]>;
