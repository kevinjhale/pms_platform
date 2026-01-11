import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  getDb,
  properties,
  units,
  leases,
  users,
  rentPayments,
  leaseCharges,
  paymentLineItems,
  type Property,
  type Unit,
  type Lease,
  type User,
} from '@/db';

export interface RentRollEntry {
  // Property info
  propertyId: string;
  propertyName: string;
  address: string;
  fullAddress: string;
  apn: string | null;
  // Utility jurisdictions
  utilityWater: string | null;
  utilityTrash: string | null;
  utilityElectricity: string | null;

  // Unit info
  unitId: string;
  unitNumber: string | null;

  // Tenant info
  tenantId: string;
  tenantName: string | null;
  tenantEmail: string;
  tenantPhone: string | null;
  coSignerName: string | null;
  coSignerEmail: string | null;
  coSignerPhone: string | null;

  // Lease terms
  leaseId: string;
  leaseStatus: Lease['status'];
  paymentStatus: string | null;
  startDate: Date;
  endDate: Date;
  listedDate: Date | null;

  // Financial - all in cents
  monthlyRent: number;
  securityDeposit: number | null;
  cleaningFee: number | null;
  totalMonthlyCharges: number; // Rent + utilities + fees
  currentBalance: number; // Positive = owes, negative = credit

  // Charges breakdown
  charges: {
    category: string;
    name: string;
    amount: number;
    amountType: 'fixed' | 'variable';
  }[];
}

export interface MonthlyPaymentSummary {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  entries: {
    leaseId: string;
    category: string;
    amountDue: number;
    amountPaid: number;
    balance: number;
  }[];
}

/**
 * Get rent roll data for an organization
 * Optimized to batch queries and avoid N+1 problem
 */
export async function getRentRoll(organizationId: string): Promise<RentRollEntry[]> {
  const db = getDb();

  // Get all active leases with property, unit, and tenant info
  const result = await db
    .select({
      property: properties,
      unit: units,
      lease: leases,
      tenant: users,
    })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        sql`${leases.status} IN ('active', 'pending', 'expired')`
      )
    )
    .orderBy(properties.name, units.unitNumber);

  if (result.length === 0) {
    return [];
  }

  const leaseIds = result.map(r => r.lease.id);

  // Batch fetch all charges for all leases in one query
  const allCharges = await db
    .select()
    .from(leaseCharges)
    .where(and(
      inArray(leaseCharges.leaseId, leaseIds),
      eq(leaseCharges.isActive, true)
    ));

  // Group charges by leaseId
  const chargesByLease = new Map<string, typeof allCharges>();
  for (const charge of allCharges) {
    const existing = chargesByLease.get(charge.leaseId) || [];
    existing.push(charge);
    chargesByLease.set(charge.leaseId, existing);
  }

  // Batch fetch all balances in one query using GROUP BY
  const allBalances = await db
    .select({
      leaseId: rentPayments.leaseId,
      totalDue: sql<number>`COALESCE(SUM(${rentPayments.amountDue}), 0)`,
      totalPaid: sql<number>`COALESCE(SUM(${rentPayments.amountPaid}), 0)`,
    })
    .from(rentPayments)
    .where(inArray(rentPayments.leaseId, leaseIds))
    .groupBy(rentPayments.leaseId);

  // Create balance map
  const balanceByLease = new Map<string, number>();
  for (const b of allBalances) {
    balanceByLease.set(b.leaseId, (b.totalDue || 0) - (b.totalPaid || 0));
  }

  // Build rent roll entries
  return result.map(row => {
    const charges = chargesByLease.get(row.lease.id) || [];

    let totalMonthlyCharges = row.lease.monthlyRent;
    const chargesBreakdown = charges.map(c => {
      const amount = c.fixedAmount || c.estimatedAmount || 0;
      if (c.category !== 'rent') {
        totalMonthlyCharges += amount;
      }
      return {
        category: c.category,
        name: c.name,
        amount,
        amountType: c.amountType as 'fixed' | 'variable',
      };
    });

    if (!chargesBreakdown.some(c => c.category === 'rent')) {
      chargesBreakdown.unshift({
        category: 'rent',
        name: 'Rent',
        amount: row.lease.monthlyRent,
        amountType: 'fixed',
      });
    }

    const currentBalance = balanceByLease.get(row.lease.id) || 0;

    return {
      propertyId: row.property.id,
      propertyName: row.property.name,
      address: row.property.address,
      fullAddress: `${row.property.address}, ${row.property.city}, ${row.property.state} ${row.property.zip}`,
      apn: row.property.apn,
      utilityWater: row.property.utilityWater,
      utilityTrash: row.property.utilityTrash,
      utilityElectricity: row.property.utilityElectricity,

      unitId: row.unit.id,
      unitNumber: row.unit.unitNumber,

      tenantId: row.tenant.id,
      tenantName: row.tenant.name,
      tenantEmail: row.tenant.email,
      tenantPhone: row.tenant.phone,
      coSignerName: row.lease.coSignerName,
      coSignerEmail: row.lease.coSignerEmail,
      coSignerPhone: row.lease.coSignerPhone,

      leaseId: row.lease.id,
      leaseStatus: row.lease.status,
      paymentStatus: row.lease.paymentStatus,
      startDate: row.lease.startDate,
      endDate: row.lease.endDate,
      listedDate: row.unit.listedDate,

      monthlyRent: row.lease.monthlyRent,
      securityDeposit: row.lease.securityDeposit,
      cleaningFee: row.lease.cleaningFee,
      totalMonthlyCharges,
      currentBalance,

      charges: chargesBreakdown,
    };
  });
}

/**
 * Get monthly payment breakdown for a specific year
 * Optimized to fetch all data in a single query
 */
export async function getMonthlyPayments(
  organizationId: string,
  year: number
): Promise<MonthlyPaymentSummary[]> {
  const db = getDb();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch all payments for the entire year in one query
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const allPayments = await db
    .select({
      leaseId: rentPayments.leaseId,
      periodStart: rentPayments.periodStart,
      lineItem: paymentLineItems,
    })
    .from(rentPayments)
    .innerJoin(leases, eq(rentPayments.leaseId, leases.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .leftJoin(paymentLineItems, eq(paymentLineItems.rentPaymentId, rentPayments.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        gte(rentPayments.periodStart, startOfYear),
        lte(rentPayments.periodStart, endOfYear)
      )
    );

  // Group by month in JavaScript
  const paymentsByMonth = new Map<number, typeof allPayments>();
  for (const payment of allPayments) {
    const month = new Date(payment.periodStart).getMonth();
    const existing = paymentsByMonth.get(month) || [];
    existing.push(payment);
    paymentsByMonth.set(month, existing);
  }

  // Build result
  return Array.from({ length: 12 }, (_, month) => {
    const monthPayments = paymentsByMonth.get(month) || [];
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const entries = monthPayments
      .filter(p => p.lineItem)
      .map(p => ({
        leaseId: p.leaseId,
        category: p.lineItem!.category,
        amountDue: p.lineItem!.amountDue,
        amountPaid: p.lineItem!.amountPaid || 0,
        balance: p.lineItem!.amountDue - (p.lineItem!.amountPaid || 0),
      }));

    return {
      month: monthStr,
      year,
      monthName: monthNames[month],
      entries,
    };
  });
}

/**
 * Calculate totals for the rent roll
 */
export function calculateRentRollTotals(entries: RentRollEntry[]) {
  return {
    totalUnits: entries.length,
    totalMonthlyRent: entries.reduce((sum, e) => sum + e.monthlyRent, 0),
    totalMonthlyCharges: entries.reduce((sum, e) => sum + e.totalMonthlyCharges, 0),
    totalBalance: entries.reduce((sum, e) => sum + e.currentBalance, 0),
    totalSecurityDeposits: entries.reduce((sum, e) => sum + (e.securityDeposit || 0), 0),
    statusCounts: {
      current: entries.filter(e => e.paymentStatus === 'current').length,
      partial: entries.filter(e => e.paymentStatus === 'partial').length,
      delinquent: entries.filter(e => e.paymentStatus === 'delinquent').length,
      eviction: entries.filter(e => e.paymentStatus === 'eviction').length,
    },
  };
}
