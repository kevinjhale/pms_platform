import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { units } from "./properties";
import { users } from "./users";

export const leases = sqliteTable("leases", {
  id: text("id").primaryKey(),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Lease Terms
  status: text("status", {
    enum: ["draft", "pending", "active", "expired", "terminated", "renewed"],
  })
    .notNull()
    .default("draft"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  monthlyRent: integer("monthly_rent").notNull(), // in cents
  securityDeposit: integer("security_deposit"), // in cents
  lateFeeAmount: integer("late_fee_amount"), // in cents
  lateFeeGraceDays: integer("late_fee_grace_days").default(5),

  // Move-in/Move-out
  moveInDate: integer("move_in_date", { mode: "timestamp" }),
  moveOutDate: integer("move_out_date", { mode: "timestamp" }),
  moveInInspectionNotes: text("move_in_inspection_notes"),
  moveOutInspectionNotes: text("move_out_inspection_notes"),

  // Renewal
  renewalOfferedAt: integer("renewal_offered_at", { mode: "timestamp" }),
  renewalStatus: text("renewal_status", {
    enum: ["not_offered", "offered", "accepted", "declined"],
  }).default("not_offered"),
  renewedFromLeaseId: text("renewed_from_lease_id"),

  // Terms & Conditions
  terms: text("terms"), // Free-form lease terms/notes
  petPolicy: text("pet_policy", {
    enum: ["no_pets", "cats_only", "dogs_only", "cats_and_dogs", "all_pets"],
  }).default("no_pets"),
  petDeposit: integer("pet_deposit"), // in cents
  parkingSpaces: integer("parking_spaces").default(0),

  // Document references (URLs to stored documents)
  leaseDocumentUrl: text("lease_document_url"),
  signedAt: integer("signed_at", { mode: "timestamp" }),
  signedByTenantAt: integer("signed_by_tenant_at", { mode: "timestamp" }),
  signedByLandlordAt: integer("signed_by_landlord_at", { mode: "timestamp" }),

  // Termination
  terminatedAt: integer("terminated_at", { mode: "timestamp" }),
  terminationReason: text("termination_reason"),
  terminatedBy: text("terminated_by").references(() => users.id),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Rent payments tracking
export const rentPayments = sqliteTable("rent_payments", {
  id: text("id").primaryKey(),
  leaseId: text("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),

  // Payment period
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),

  // Amounts
  amountDue: integer("amount_due").notNull(), // in cents
  amountPaid: integer("amount_paid").default(0), // in cents
  lateFee: integer("late_fee").default(0), // in cents

  // Status
  status: text("status", {
    enum: ["upcoming", "due", "partial", "paid", "late", "waived"],
  })
    .notNull()
    .default("upcoming"),

  // Payment details
  paidAt: integer("paid_at", { mode: "timestamp" }),
  paymentMethod: text("payment_method", {
    enum: ["cash", "check", "ach", "card", "other"],
  }),
  paymentReference: text("payment_reference"), // Check number, transaction ID, etc.
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // Notes
  notes: text("notes"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Lease = typeof leases.$inferSelect;
export type NewLease = typeof leases.$inferInsert;
export type RentPayment = typeof rentPayments.$inferSelect;
export type NewRentPayment = typeof rentPayments.$inferInsert;
