import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { units } from "./properties";
import { users } from "./users";
import { leases } from "./leases";

export const maintenanceRequests = sqliteTable("maintenance_requests", {
  id: text("id").primaryKey(),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  leaseId: text("lease_id").references(() => leases.id, { onDelete: "set null" }),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Request Details
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: [
      "plumbing",
      "electrical",
      "hvac",
      "appliance",
      "structural",
      "pest",
      "landscaping",
      "cleaning",
      "security",
      "other",
    ],
  }).notNull(),
  priority: text("priority", {
    enum: ["low", "medium", "high", "emergency"],
  })
    .notNull()
    .default("medium"),

  // Status
  status: text("status", {
    enum: ["open", "acknowledged", "in_progress", "pending_parts", "completed", "cancelled"],
  })
    .notNull()
    .default("open"),

  // Assignment
  assignedTo: text("assigned_to").references(() => users.id),
  assignedAt: integer("assigned_at", { mode: "timestamp" }),

  // Scheduling
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  scheduledTimeSlot: text("scheduled_time_slot"), // e.g., "9am-12pm"
  permissionToEnter: integer("permission_to_enter", { mode: "boolean" }).default(false),

  // Completion
  completedAt: integer("completed_at", { mode: "timestamp" }),
  completedBy: text("completed_by").references(() => users.id),
  completionNotes: text("completion_notes"),
  resolutionSummary: text("resolution_summary"),

  // Cost tracking
  estimatedCost: integer("estimated_cost"), // in cents
  actualCost: integer("actual_cost"), // in cents
  costApprovedBy: text("cost_approved_by").references(() => users.id),
  costApprovedAt: integer("cost_approved_at", { mode: "timestamp" }),

  // Time tracking
  hoursSpent: real("hours_spent"), // nullable, decimal hours (e.g., 1.5 = 1h 30m)

  // Photos
  photos: text("photos", { mode: "json" }).$type<string[]>(),

  // Tenant satisfaction
  rating: integer("rating"), // 1-5
  feedback: text("feedback"),

  // Archive
  archived: integer("archived", { mode: "boolean" }).default(false),
  archivedAt: integer("archived_at", { mode: "timestamp" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const maintenanceComments = sqliteTable("maintenance_comments", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isInternal: integer("is_internal", { mode: "boolean" }).default(false), // Hidden from tenants
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type NewMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
export type MaintenanceComment = typeof maintenanceComments.$inferSelect;
export type NewMaintenanceComment = typeof maintenanceComments.$inferInsert;
