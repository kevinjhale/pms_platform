import {
  getDb,
  leases,
  rentPayments,
  units,
  properties,
  users,
} from "@/db";
import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import { generateId, now } from "@/lib/utils";
import type { Lease, NewLease, RentPayment, NewRentPayment } from "@/db/schema/leases";

export type LeaseWithDetails = Lease & {
  tenantName: string;
  tenantEmail: string;
  unitNumber: string | null;
  propertyName: string;
  propertyAddress: string;
  organizationId: string;
};

// ============ LEASE CRUD ============

export async function createLease(
  data: Omit<NewLease, "id" | "createdAt" | "updatedAt">
): Promise<Lease> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  await db.insert(leases).values({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const result = await db.select().from(leases).where(eq(leases.id, id)).limit(1);
  return result[0];
}

export async function getLeaseById(id: string): Promise<LeaseWithDetails | null> {
  const db = getDb();

  const results = await db
    .select({
      lease: leases,
      tenantName: users.name,
      tenantEmail: users.email,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      organizationId: properties.organizationId,
    })
    .from(leases)
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(leases.id, id))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  return {
    ...row.lease,
    tenantName: row.tenantName || "Unknown",
    tenantEmail: row.tenantEmail,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    organizationId: row.organizationId,
  };
}

export async function getLeasesByOrganization(
  orgId: string
): Promise<LeaseWithDetails[]> {
  const db = getDb();

  const results = await db
    .select({
      lease: leases,
      tenantName: users.name,
      tenantEmail: users.email,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      organizationId: properties.organizationId,
    })
    .from(leases)
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, orgId))
    .orderBy(desc(leases.createdAt));

  return results.map((row) => ({
    ...row.lease,
    tenantName: row.tenantName || "Unknown",
    tenantEmail: row.tenantEmail,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    organizationId: row.organizationId,
  }));
}

export async function getLeasesByTenant(tenantId: string): Promise<LeaseWithDetails[]> {
  const db = getDb();

  const results = await db
    .select({
      lease: leases,
      tenantName: users.name,
      tenantEmail: users.email,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      organizationId: properties.organizationId,
    })
    .from(leases)
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(leases.tenantId, tenantId))
    .orderBy(desc(leases.startDate));

  return results.map((row) => ({
    ...row.lease,
    tenantName: row.tenantName || "Unknown",
    tenantEmail: row.tenantEmail,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    organizationId: row.organizationId,
  }));
}

export async function getActiveLeaseForUnit(unitId: string): Promise<Lease | null> {
  const db = getDb();
  const currentDate = now();

  const results = await db
    .select()
    .from(leases)
    .where(
      and(
        eq(leases.unitId, unitId),
        eq(leases.status, "active"),
        lte(leases.startDate, currentDate),
        gte(leases.endDate, currentDate)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function updateLease(
  id: string,
  data: Partial<NewLease>
): Promise<void> {
  const db = getDb();
  await db
    .update(leases)
    .set({ ...data, updatedAt: now() })
    .where(eq(leases.id, id));
}

export async function activateLease(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(leases)
    .set({ status: "active", updatedAt: now() })
    .where(eq(leases.id, id));
}

export async function terminateLease(
  id: string,
  terminatedBy: string,
  reason?: string
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(leases)
    .set({
      status: "terminated",
      terminatedAt: timestamp,
      terminatedBy,
      terminationReason: reason || null,
      updatedAt: timestamp,
    })
    .where(eq(leases.id, id));
}

// ============ RENT PAYMENTS ============

export async function createRentPayment(
  data: Omit<NewRentPayment, "id" | "createdAt" | "updatedAt">
): Promise<RentPayment> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  await db.insert(rentPayments).values({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const result = await db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.id, id))
    .limit(1);
  return result[0];
}

export async function getPaymentsByLease(leaseId: string): Promise<RentPayment[]> {
  const db = getDb();
  return db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.leaseId, leaseId))
    .orderBy(desc(rentPayments.dueDate));
}

export async function getUpcomingPayments(
  organizationId: string,
  daysAhead = 30
): Promise<(RentPayment & { tenantName: string; propertyName: string })[]> {
  const db = getDb();
  const currentDate = now();
  const futureDate = new Date(currentDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      payment: rentPayments,
      tenantName: users.name,
      propertyName: properties.name,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        gte(rentPayments.dueDate, currentDate),
        lte(rentPayments.dueDate, futureDate),
        or(
          eq(rentPayments.status, "upcoming"),
          eq(rentPayments.status, "due")
        )
      )
    )
    .orderBy(rentPayments.dueDate);

  return results.map((row) => ({
    ...row.payment,
    tenantName: row.tenantName || "Unknown",
    propertyName: row.propertyName,
  }));
}

export async function getOverduePayments(
  organizationId: string
): Promise<(RentPayment & { tenantName: string; propertyName: string })[]> {
  const db = getDb();
  const currentDate = now();

  const results = await db
    .select({
      payment: rentPayments,
      tenantName: users.name,
      propertyName: properties.name,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        lte(rentPayments.dueDate, currentDate),
        eq(rentPayments.status, "late")
      )
    )
    .orderBy(rentPayments.dueDate);

  return results.map((row) => ({
    ...row.payment,
    tenantName: row.tenantName || "Unknown",
    propertyName: row.propertyName,
  }));
}

export async function recordPayment(
  paymentId: string,
  data: {
    amountPaid: number;
    paymentMethod: "cash" | "check" | "ach" | "card" | "other";
    paymentReference?: string;
    notes?: string;
  }
): Promise<void> {
  const db = getDb();
  const timestamp = now();

  // Get current payment
  const current = await db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.id, paymentId))
    .limit(1);

  if (current.length === 0) return;

  const payment = current[0];
  const totalPaid = (payment.amountPaid || 0) + data.amountPaid;
  const amountDue = payment.amountDue + (payment.lateFee || 0);

  let status: "partial" | "paid" = "partial";
  if (totalPaid >= amountDue) {
    status = "paid";
  }

  await db
    .update(rentPayments)
    .set({
      amountPaid: totalPaid,
      status,
      paidAt: status === "paid" ? timestamp : null,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference || null,
      notes: data.notes || null,
      updatedAt: timestamp,
    })
    .where(eq(rentPayments.id, paymentId));
}

export async function generateMonthlyPayments(leaseId: string): Promise<void> {
  const db = getDb();
  const lease = await db
    .select()
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (lease.length === 0) return;

  const leaseData = lease[0];
  const startDate = new Date(leaseData.startDate);
  const endDate = new Date(leaseData.endDate);
  const timestamp = now();

  // Generate payment records for each month
  const currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const periodStart = new Date(currentMonth);
    const periodEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dueDate = new Date(currentMonth); // Due on 1st of month

    await db.insert(rentPayments).values({
      id: generateId(),
      leaseId,
      periodStart,
      periodEnd,
      dueDate,
      amountDue: leaseData.monthlyRent,
      status: "upcoming",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
}
