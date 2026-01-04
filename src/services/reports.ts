import {
  getDb,
  properties,
  units,
  leases,
  rentPayments,
  maintenanceRequests,
  applications,
} from "@/db";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { now } from "@/lib/utils";

// ============ OCCUPANCY METRICS ============

export interface OccupancyMetrics {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
}

export async function getOccupancyMetrics(
  organizationId: string
): Promise<OccupancyMetrics> {
  const db = getDb();

  // Get all units for the organization
  const allUnits = await db
    .select({ id: units.id, status: units.status })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId));

  const totalUnits = allUnits.length;
  const occupiedUnits = allUnits.filter((u) => u.status === "occupied").length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  return {
    totalUnits,
    occupiedUnits,
    vacantUnits,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  };
}

// ============ REVENUE METRICS ============

export interface RevenueMetrics {
  expectedMonthly: number; // in cents
  collectedThisMonth: number; // in cents
  outstandingBalance: number; // in cents
  collectionRate: number;
  overdueCount: number;
}

export async function getRevenueMetrics(
  organizationId: string
): Promise<RevenueMetrics> {
  const db = getDb();
  const currentDate = now();
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get all payments for current month for this organization
  const payments = await db
    .select({
      amountDue: rentPayments.amountDue,
      amountPaid: rentPayments.amountPaid,
      lateFee: rentPayments.lateFee,
      status: rentPayments.status,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        gte(rentPayments.dueDate, firstOfMonth),
        lte(rentPayments.dueDate, lastOfMonth)
      )
    );

  let expectedMonthly = 0;
  let collectedThisMonth = 0;
  let outstandingBalance = 0;
  let overdueCount = 0;

  for (const payment of payments) {
    const total = payment.amountDue + (payment.lateFee || 0);
    const paid = payment.amountPaid || 0;
    expectedMonthly += total;
    collectedThisMonth += paid;
    outstandingBalance += total - paid;
    if (payment.status === "late") {
      overdueCount++;
    }
  }

  const collectionRate = expectedMonthly > 0
    ? (collectedThisMonth / expectedMonthly) * 100
    : 0;

  return {
    expectedMonthly,
    collectedThisMonth,
    outstandingBalance,
    collectionRate: Math.round(collectionRate * 10) / 10,
    overdueCount,
  };
}

// ============ MAINTENANCE METRICS ============

export interface MaintenanceMetrics {
  openRequests: number;
  inProgressRequests: number;
  completedThisMonth: number;
  avgCompletionDays: number;
  byCategory: Record<string, number>;
}

export async function getMaintenanceMetrics(
  organizationId: string
): Promise<MaintenanceMetrics> {
  const db = getDb();
  const currentDate = now();
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const requests = await db
    .select({
      status: maintenanceRequests.status,
      category: maintenanceRequests.category,
      createdAt: maintenanceRequests.createdAt,
      completedAt: maintenanceRequests.completedAt,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId));

  const openRequests = requests.filter(
    (r) => r.status === "open" || r.status === "acknowledged"
  ).length;

  const inProgressRequests = requests.filter(
    (r) => r.status === "in_progress" || r.status === "pending_parts"
  ).length;

  const completedThisMonth = requests.filter(
    (r) => r.status === "completed" && r.completedAt && r.completedAt >= firstOfMonth
  ).length;

  // Calculate average completion time for completed requests
  const completedRequests = requests.filter(
    (r) => r.status === "completed" && r.createdAt && r.completedAt
  );

  let avgCompletionDays = 0;
  if (completedRequests.length > 0) {
    const totalDays = completedRequests.reduce((acc, r) => {
      const created = new Date(r.createdAt!).getTime();
      const completed = new Date(r.completedAt!).getTime();
      return acc + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgCompletionDays = Math.round((totalDays / completedRequests.length) * 10) / 10;
  }

  // Count by category
  const byCategory: Record<string, number> = {};
  for (const req of requests) {
    if (req.status !== "completed" && req.status !== "cancelled") {
      byCategory[req.category] = (byCategory[req.category] || 0) + 1;
    }
  }

  return {
    openRequests,
    inProgressRequests,
    completedThisMonth,
    avgCompletionDays,
    byCategory,
  };
}

// ============ LEASE METRICS ============

export interface LeaseMetrics {
  activeLeases: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  upcomingExpirations: Array<{
    leaseId: string;
    tenantName: string;
    propertyName: string;
    unitNumber: string | null;
    endDate: Date;
    daysUntilExpiry: number;
  }>;
}

export async function getLeaseMetrics(
  organizationId: string
): Promise<LeaseMetrics> {
  const db = getDb();
  const currentDate = now();
  const in30Days = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in90Days = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  const activeLeaseData = await db
    .select({
      leaseId: leases.id,
      endDate: leases.endDate,
      tenantName: sql<string>`(SELECT name FROM users WHERE id = ${leases.tenantId})`,
      propertyName: properties.name,
      unitNumber: units.unitNumber,
    })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(eq(properties.organizationId, organizationId), eq(leases.status, "active")))
    .orderBy(leases.endDate);

  const activeLeases = activeLeaseData.length;

  const expiringIn30Days = activeLeaseData.filter(
    (l) => l.endDate <= in30Days
  ).length;
  const expiringIn60Days = activeLeaseData.filter(
    (l) => l.endDate <= in60Days
  ).length;
  const expiringIn90Days = activeLeaseData.filter(
    (l) => l.endDate <= in90Days
  ).length;

  // Get top 10 upcoming expirations
  const upcomingExpirations = activeLeaseData
    .filter((l) => l.endDate <= in90Days)
    .slice(0, 10)
    .map((l) => ({
      leaseId: l.leaseId,
      tenantName: l.tenantName || "Unknown",
      propertyName: l.propertyName,
      unitNumber: l.unitNumber,
      endDate: l.endDate,
      daysUntilExpiry: Math.ceil(
        (new Date(l.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

  return {
    activeLeases,
    expiringIn30Days,
    expiringIn60Days,
    expiringIn90Days,
    upcomingExpirations,
  };
}

// ============ APPLICATION METRICS ============

export interface ApplicationMetrics {
  pendingApplications: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  avgProcessingDays: number;
}

export async function getApplicationMetrics(
  organizationId: string
): Promise<ApplicationMetrics> {
  const db = getDb();
  const currentDate = now();
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const allApps = await db
    .select({
      status: applications.status,
      submittedAt: applications.submittedAt,
      decidedAt: applications.decidedAt,
    })
    .from(applications)
    .innerJoin(units, eq(applications.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId));

  const pendingApplications = allApps.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;

  const approvedThisMonth = allApps.filter(
    (a) => a.status === "approved" && a.decidedAt && a.decidedAt >= firstOfMonth
  ).length;

  const rejectedThisMonth = allApps.filter(
    (a) => a.status === "rejected" && a.decidedAt && a.decidedAt >= firstOfMonth
  ).length;

  // Calculate average processing time
  const processedApps = allApps.filter(
    (a) =>
      (a.status === "approved" || a.status === "rejected") &&
      a.submittedAt &&
      a.decidedAt
  );

  let avgProcessingDays = 0;
  if (processedApps.length > 0) {
    const totalDays = processedApps.reduce((acc, a) => {
      const submitted = new Date(a.submittedAt!).getTime();
      const decided = new Date(a.decidedAt!).getTime();
      return acc + (decided - submitted) / (1000 * 60 * 60 * 24);
    }, 0);
    avgProcessingDays = Math.round((totalDays / processedApps.length) * 10) / 10;
  }

  return {
    pendingApplications,
    approvedThisMonth,
    rejectedThisMonth,
    avgProcessingDays,
  };
}

// ============ COMBINED DASHBOARD ============

export interface DashboardReport {
  occupancy: OccupancyMetrics;
  revenue: RevenueMetrics;
  maintenance: MaintenanceMetrics;
  leases: LeaseMetrics;
  applications: ApplicationMetrics;
  generatedAt: Date;
}

export async function getDashboardReport(
  organizationId: string
): Promise<DashboardReport> {
  const [occupancy, revenue, maintenance, leaseMetrics, applicationMetrics] =
    await Promise.all([
      getOccupancyMetrics(organizationId),
      getRevenueMetrics(organizationId),
      getMaintenanceMetrics(organizationId),
      getLeaseMetrics(organizationId),
      getApplicationMetrics(organizationId),
    ]);

  return {
    occupancy,
    revenue,
    maintenance,
    leases: leaseMetrics,
    applications: applicationMetrics,
    generatedAt: now(),
  };
}
