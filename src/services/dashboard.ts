import { eq, desc, and, gte } from 'drizzle-orm';
import {
  getDb,
  dashboardConfigs,
  maintenanceRequests,
  units,
  properties,
  users,
  applications,
  leases,
  rentPayments,
} from '@/db';
import type { DashboardCard, DashboardConfig } from '@/db/schema/dashboard';
import { generateId, now } from '@/lib/utils';
import {
  getOccupancyMetrics,
  getRevenueMetrics,
  getMaintenanceMetrics,
  getLeaseMetrics,
  getApplicationMetrics,
  getRevenueHistory,
  type OccupancyMetrics,
  type RevenueMetrics,
  type MaintenanceMetrics,
  type LeaseMetrics,
  type ApplicationMetrics,
  type MonthlyRevenueData,
} from './reports';
import { getPropertiesByOrganization, type PropertyWithUnitCount } from './properties';
import type { DataRequirement } from '@/lib/dashboard/cardTypes';
import { CARD_TYPE_DEFINITIONS } from '@/lib/dashboard/cardTypes';

// ============ DASHBOARD CONFIG CRUD ============

export async function getDashboardConfig(userId: string): Promise<DashboardConfig | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(dashboardConfigs)
    .where(eq(dashboardConfigs.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function saveDashboardConfig(userId: string, cards: DashboardCard[]): Promise<void> {
  const db = getDb();
  const existing = await getDashboardConfig(userId);

  if (existing) {
    await db
      .update(dashboardConfigs)
      .set({ cards, updatedAt: now() })
      .where(eq(dashboardConfigs.userId, userId));
  } else {
    await db.insert(dashboardConfigs).values({
      id: generateId(),
      userId,
      cards,
      createdAt: now(),
      updatedAt: now(),
    });
  }
}

// ============ DEFAULT DASHBOARD ============

export function getDefaultDashboardCards(): DashboardCard[] {
  return [
    { id: 'default-1', type: 'occupancy_rate', position: { col: 1, row: 1, colSpan: 1, rowSpan: 1 } },
    { id: 'default-2', type: 'collection_rate', position: { col: 2, row: 1, colSpan: 1, rowSpan: 1 } },
    { id: 'default-3', type: 'open_maintenance', position: { col: 3, row: 1, colSpan: 1, rowSpan: 1 } },
    { id: 'default-4', type: 'expiring_leases_30', position: { col: 4, row: 1, colSpan: 1, rowSpan: 1 } },
    { id: 'default-5', type: 'revenue_chart', position: { col: 1, row: 2, colSpan: 2, rowSpan: 2 } },
    { id: 'default-6', type: 'occupancy_chart', position: { col: 3, row: 2, colSpan: 2, rowSpan: 2 } },
    { id: 'default-7', type: 'recent_maintenance', position: { col: 1, row: 4, colSpan: 2, rowSpan: 2 }, config: { limit: 5 } },
    { id: 'default-8', type: 'upcoming_lease_expirations', position: { col: 3, row: 4, colSpan: 2, rowSpan: 2 }, config: { limit: 5 } },
  ];
}

// ============ DASHBOARD DATA TYPES ============

export interface RecentMaintenance {
  id: string;
  title: string;
  status: string;
  priority: string;
  propertyName: string;
  unitNumber: string | null;
  createdAt: Date;
}

export interface RecentApplication {
  id: string;
  applicantName: string | null;
  applicantEmail: string;
  propertyName: string;
  unitNumber: string | null;
  status: string;
  submittedAt: Date | null;
}

export interface OverduePayment {
  leaseId: string;
  tenantName: string | null;
  tenantEmail: string;
  propertyName: string;
  unitNumber: string | null;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
}

export interface VacantUnit {
  unitId: string;
  unitNumber: string | null;
  propertyId: string;
  propertyName: string;
  monthlyRent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

export interface PaymentStatusCounts {
  current: number;
  partial: number;
  delinquent: number;
}

export interface DashboardData {
  occupancy: OccupancyMetrics;
  revenue: RevenueMetrics;
  maintenance: MaintenanceMetrics;
  leases: LeaseMetrics;
  applications: ApplicationMetrics;
  revenueHistory: MonthlyRevenueData[];
  properties: PropertyWithUnitCount[];
  recentMaintenance: RecentMaintenance[];
  recentApplications: RecentApplication[];
  overduePayments: OverduePayment[];
  vacantUnits: VacantUnit[];
  paymentStatusCounts: PaymentStatusCounts;
}

// ============ DATA FETCHERS FOR LISTS ============

async function getRecentMaintenanceRequests(organizationId: string, limit = 5): Promise<RecentMaintenance[]> {
  const db = getDb();

  const results = await db
    .select({
      id: maintenanceRequests.id,
      title: maintenanceRequests.title,
      status: maintenanceRequests.status,
      priority: maintenanceRequests.priority,
      propertyName: properties.name,
      unitNumber: units.unitNumber,
      createdAt: maintenanceRequests.createdAt,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(maintenanceRequests.createdAt))
    .limit(limit);

  return results;
}

async function getRecentApplicationsList(organizationId: string, limit = 5): Promise<RecentApplication[]> {
  const db = getDb();

  const results = await db
    .select({
      id: applications.id,
      applicantName: users.name,
      applicantEmail: users.email,
      propertyName: properties.name,
      unitNumber: units.unitNumber,
      status: applications.status,
      submittedAt: applications.submittedAt,
    })
    .from(applications)
    .innerJoin(users, eq(applications.applicantId, users.id))
    .innerJoin(units, eq(applications.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(applications.submittedAt))
    .limit(limit);

  return results;
}

async function getOverduePaymentsList(organizationId: string, limit = 10): Promise<OverduePayment[]> {
  const db = getDb();
  const currentDate = now();

  const results = await db
    .select({
      leaseId: leases.id,
      tenantName: users.name,
      tenantEmail: users.email,
      propertyName: properties.name,
      unitNumber: units.unitNumber,
      amountDue: rentPayments.amountDue,
      amountPaid: rentPayments.amountPaid,
      dueDate: rentPayments.dueDate,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(rentPayments.status, 'late')
      )
    )
    .orderBy(desc(rentPayments.dueDate))
    .limit(limit);

  return results.map(r => ({
    ...r,
    amountPaid: r.amountPaid || 0,
  }));
}

async function getVacantUnitsList(organizationId: string): Promise<VacantUnit[]> {
  const db = getDb();

  const results = await db
    .select({
      unitId: units.id,
      unitNumber: units.unitNumber,
      propertyId: properties.id,
      propertyName: properties.name,
      monthlyRent: units.rentAmount,
      bedrooms: units.bedrooms,
      bathrooms: units.bathrooms,
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(units.status, 'available')
      )
    )
    .orderBy(properties.name, units.unitNumber);

  return results;
}

async function getPaymentStatusCounts(organizationId: string): Promise<PaymentStatusCounts> {
  const db = getDb();
  const currentDate = now();
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const payments = await db
    .select({
      status: rentPayments.status,
      amountDue: rentPayments.amountDue,
      amountPaid: rentPayments.amountPaid,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        gte(rentPayments.dueDate, firstOfMonth)
      )
    );

  let current = 0;
  let partial = 0;
  let delinquent = 0;

  for (const p of payments) {
    const paid = p.amountPaid || 0;
    if (paid >= p.amountDue) {
      current++;
    } else if (paid > 0) {
      partial++;
    } else if (p.status === 'late') {
      delinquent++;
    }
  }

  return { current, partial, delinquent };
}

// ============ MAIN DATA FETCHER ============

export async function getDashboardData(
  organizationId: string,
  cards: DashboardCard[]
): Promise<DashboardData> {
  // Determine which data sources we need based on cards
  const requirements = new Set<DataRequirement>();
  for (const card of cards) {
    const def = CARD_TYPE_DEFINITIONS[card.type];
    if (def) {
      def.dataRequirements.forEach(r => requirements.add(r));
    }
  }

  // Build parallel fetch promises based on requirements
  const fetchers: Record<string, Promise<unknown>> = {};

  if (requirements.has('occupancy')) {
    fetchers.occupancy = getOccupancyMetrics(organizationId);
  }
  if (requirements.has('revenue')) {
    fetchers.revenue = getRevenueMetrics(organizationId);
  }
  if (requirements.has('maintenance')) {
    fetchers.maintenance = getMaintenanceMetrics(organizationId);
    fetchers.recentMaintenance = getRecentMaintenanceRequests(organizationId, 10);
  }
  if (requirements.has('leases')) {
    fetchers.leases = getLeaseMetrics(organizationId);
  }
  if (requirements.has('applications')) {
    fetchers.applications = getApplicationMetrics(organizationId);
    fetchers.recentApplications = getRecentApplicationsList(organizationId, 10);
  }
  if (requirements.has('revenueHistory')) {
    // Default to last 6 months
    const currentDate = now();
    const startMonth = currentDate.getMonth() - 5;
    const startYear = currentDate.getFullYear() + Math.floor(startMonth / 12);
    const adjustedStartMonth = ((startMonth % 12) + 12) % 12;
    fetchers.revenueHistory = getRevenueHistory(
      organizationId,
      adjustedStartMonth + 1,
      startYear,
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    );
  }
  if (requirements.has('rentRoll')) {
    fetchers.paymentStatusCounts = getPaymentStatusCounts(organizationId);
    fetchers.overduePayments = getOverduePaymentsList(organizationId, 10);
  }
  if (requirements.has('properties')) {
    fetchers.properties = getPropertiesByOrganization(organizationId);
    fetchers.vacantUnits = getVacantUnitsList(organizationId);
  }

  // Execute all fetchers in parallel
  const entries = Object.entries(fetchers);
  const results = await Promise.all(entries.map(([, p]) => p));

  // Build result object with proper typing
  const data = Object.fromEntries(entries.map(([key], i) => [key, results[i]]));

  // Default values for missing data
  const defaults: DashboardData = {
    occupancy: { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0 },
    revenue: { expectedMonthly: 0, collectedThisMonth: 0, outstandingBalance: 0, collectionRate: 0, overdueCount: 0 },
    maintenance: { openRequests: 0, inProgressRequests: 0, completedThisMonth: 0, avgCompletionDays: 0, byCategory: {} },
    leases: { activeLeases: 0, expiringIn30Days: 0, expiringIn60Days: 0, expiringIn90Days: 0, upcomingExpirations: [] },
    applications: { pendingApplications: 0, approvedThisMonth: 0, rejectedThisMonth: 0, avgProcessingDays: 0 },
    revenueHistory: [],
    properties: [],
    recentMaintenance: [],
    recentApplications: [],
    overduePayments: [],
    vacantUnits: [],
    paymentStatusCounts: { current: 0, partial: 0, delinquent: 0 },
  };

  return {
    occupancy: data.occupancy ?? defaults.occupancy,
    revenue: data.revenue ?? defaults.revenue,
    maintenance: data.maintenance ?? defaults.maintenance,
    leases: data.leases ?? defaults.leases,
    applications: data.applications ?? defaults.applications,
    revenueHistory: data.revenueHistory ?? defaults.revenueHistory,
    properties: data.properties ?? defaults.properties,
    recentMaintenance: data.recentMaintenance ?? defaults.recentMaintenance,
    recentApplications: data.recentApplications ?? defaults.recentApplications,
    overduePayments: data.overduePayments ?? defaults.overduePayments,
    vacantUnits: data.vacantUnits ?? defaults.vacantUnits,
    paymentStatusCounts: data.paymentStatusCounts ?? defaults.paymentStatusCounts,
  } as DashboardData;
}
