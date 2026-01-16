import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import {
  getDb,
  properties,
  units,
  leases,
  rentPayments,
  propertyManagers,
} from '@/db';

export interface PMRevenueByProperty {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  splitPercentage: number;
  totalCollected: number; // Total rent collected for this property (in cents)
  pmShare: number; // PM's share based on split percentage (in cents)
  paymentCount: number;
}

export interface PMRevenueSummary {
  totalCollected: number; // Total collected across all properties (in cents)
  totalPMShare: number; // Total PM share (in cents)
  propertyCount: number;
  paymentCount: number;
}

export interface PMRevenueByMonth {
  month: string; // YYYY-MM format
  monthName: string;
  year: number;
  totalCollected: number; // in cents
  pmShare: number; // in cents
  paymentCount: number;
}

/**
 * Get PM revenue breakdown by property
 * Only includes properties with accepted PM assignments
 */
export async function getPMRevenueByProperty(userId: string): Promise<PMRevenueByProperty[]> {
  const db = getDb();

  // Get all accepted PM assignments with property info and payment totals
  const result = await db
    .select({
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: sql<string>`${properties.address} || ', ' || ${properties.city} || ', ' || ${properties.state}`,
      splitPercentage: propertyManagers.splitPercentage,
      totalCollected: sql<number>`COALESCE(SUM(${rentPayments.amountPaid}), 0)`,
      paymentCount: sql<number>`COUNT(DISTINCT ${rentPayments.id})`,
    })
    .from(propertyManagers)
    .innerJoin(properties, eq(propertyManagers.propertyId, properties.id))
    .leftJoin(units, eq(units.propertyId, properties.id))
    .leftJoin(leases, eq(leases.unitId, units.id))
    .leftJoin(rentPayments, and(
      eq(rentPayments.leaseId, leases.id),
      sql`${rentPayments.amountPaid} > 0`
    ))
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted')
      )
    )
    .groupBy(properties.id, properties.name, properties.address, properties.city, properties.state, propertyManagers.splitPercentage)
    .orderBy(desc(sql`COALESCE(SUM(${rentPayments.amountPaid}), 0)`));

  return result.map(row => ({
    propertyId: row.propertyId,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    splitPercentage: row.splitPercentage,
    totalCollected: Number(row.totalCollected) || 0,
    pmShare: Math.round((Number(row.totalCollected) || 0) * row.splitPercentage / 100),
    paymentCount: Number(row.paymentCount) || 0,
  }));
}

/**
 * Get PM revenue summary totals
 */
export async function getPMRevenueSummary(userId: string): Promise<PMRevenueSummary> {
  const byProperty = await getPMRevenueByProperty(userId);

  return {
    totalCollected: byProperty.reduce((sum, p) => sum + p.totalCollected, 0),
    totalPMShare: byProperty.reduce((sum, p) => sum + p.pmShare, 0),
    propertyCount: byProperty.length,
    paymentCount: byProperty.reduce((sum, p) => sum + p.paymentCount, 0),
  };
}

/**
 * Get PM revenue by month for a specific year
 */
export async function getPMRevenueByMonth(userId: string, year: number): Promise<PMRevenueByMonth[]> {
  const db = getDb();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  // Get all payments for PM's properties in the given year
  const result = await db
    .select({
      paidAt: rentPayments.paidAt,
      amountPaid: rentPayments.amountPaid,
      splitPercentage: propertyManagers.splitPercentage,
    })
    .from(propertyManagers)
    .innerJoin(properties, eq(propertyManagers.propertyId, properties.id))
    .innerJoin(units, eq(units.propertyId, properties.id))
    .innerJoin(leases, eq(leases.unitId, units.id))
    .innerJoin(rentPayments, eq(rentPayments.leaseId, leases.id))
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted'),
        sql`${rentPayments.amountPaid} > 0`,
        gte(rentPayments.paidAt, startOfYear),
        lte(rentPayments.paidAt, endOfYear)
      )
    );

  // Group by month
  const monthlyData = new Map<number, { totalCollected: number; pmShare: number; paymentCount: number }>();

  for (const row of result) {
    if (!row.paidAt) continue;
    const month = new Date(row.paidAt).getMonth();
    const existing = monthlyData.get(month) || { totalCollected: 0, pmShare: 0, paymentCount: 0 };
    const amountPaid = row.amountPaid || 0;
    existing.totalCollected += amountPaid;
    existing.pmShare += Math.round(amountPaid * row.splitPercentage / 100);
    existing.paymentCount += 1;
    monthlyData.set(month, existing);
  }

  // Build result for all 12 months
  return Array.from({ length: 12 }, (_, month) => {
    const data = monthlyData.get(month) || { totalCollected: 0, pmShare: 0, paymentCount: 0 };
    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthName: monthNames[month],
      year,
      totalCollected: data.totalCollected,
      pmShare: data.pmShare,
      paymentCount: data.paymentCount,
    };
  });
}

/**
 * Get PM revenue for a date range (useful for custom reports)
 */
export async function getPMRevenueForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PMRevenueSummary> {
  const db = getDb();

  const result = await db
    .select({
      totalCollected: sql<number>`COALESCE(SUM(${rentPayments.amountPaid}), 0)`,
      paymentCount: sql<number>`COUNT(DISTINCT ${rentPayments.id})`,
      splitPercentage: propertyManagers.splitPercentage,
    })
    .from(propertyManagers)
    .innerJoin(properties, eq(propertyManagers.propertyId, properties.id))
    .innerJoin(units, eq(units.propertyId, properties.id))
    .innerJoin(leases, eq(leases.unitId, units.id))
    .innerJoin(rentPayments, eq(rentPayments.leaseId, leases.id))
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted'),
        sql`${rentPayments.amountPaid} > 0`,
        gte(rentPayments.paidAt, startDate),
        lte(rentPayments.paidAt, endDate)
      )
    )
    .groupBy(propertyManagers.splitPercentage);

  // Sum across all split percentages
  let totalCollected = 0;
  let totalPMShare = 0;
  let paymentCount = 0;

  for (const row of result) {
    const collected = Number(row.totalCollected) || 0;
    totalCollected += collected;
    totalPMShare += Math.round(collected * row.splitPercentage / 100);
    paymentCount += Number(row.paymentCount) || 0;
  }

  // Get property count separately
  const propertyResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${propertyManagers.propertyId})` })
    .from(propertyManagers)
    .where(
      and(
        eq(propertyManagers.userId, userId),
        eq(propertyManagers.status, 'accepted')
      )
    );

  return {
    totalCollected,
    totalPMShare,
    propertyCount: Number(propertyResult[0]?.count) || 0,
    paymentCount,
  };
}
