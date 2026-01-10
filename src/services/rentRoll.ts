import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
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
        // Include active, pending, and expired leases (not terminated or draft)
        sql`${leases.status} IN ('active', 'pending', 'expired')`
      )
    )
    .orderBy(properties.name, units.unitNumber);

  // For each lease, get charges and calculate balances
  const rentRollEntries: RentRollEntry[] = [];

  for (const row of result) {
    // Get charges for this lease
    const charges = await db
      .select()
      .from(leaseCharges)
      .where(and(eq(leaseCharges.leaseId, row.lease.id), eq(leaseCharges.isActive, true)));

    // Calculate total monthly charges
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

    // Add rent as first charge if not already in charges
    if (!chargesBreakdown.some(c => c.category === 'rent')) {
      chargesBreakdown.unshift({
        category: 'rent',
        name: 'Rent',
        amount: row.lease.monthlyRent,
        amountType: 'fixed',
      });
    }

    // Calculate current balance (sum of all unpaid amounts)
    const balanceResult = await db
      .select({
        totalDue: sql<number>`COALESCE(SUM(${rentPayments.amountDue}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${rentPayments.amountPaid}), 0)`,
      })
      .from(rentPayments)
      .where(eq(rentPayments.leaseId, row.lease.id));

    const currentBalance = (balanceResult[0]?.totalDue || 0) - (balanceResult[0]?.totalPaid || 0);

    rentRollEntries.push({
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
    });
  }

  return rentRollEntries;
}

/**
 * Get monthly payment breakdown for a specific year
 */
export async function getMonthlyPayments(
  organizationId: string,
  year: number
): Promise<MonthlyPaymentSummary[]> {
  const db = getDb();
  const months: MonthlyPaymentSummary[] = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (let month = 0; month < 12; month++) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Get all payments for this month for the organization
    const payments = await db
      .select({
        leaseId: rentPayments.leaseId,
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
          gte(rentPayments.periodStart, startOfMonth),
          lte(rentPayments.periodStart, endOfMonth)
        )
      );

    const entries = payments
      .filter(p => p.lineItem)
      .map(p => ({
        leaseId: p.leaseId,
        category: p.lineItem!.category,
        amountDue: p.lineItem!.amountDue,
        amountPaid: p.lineItem!.amountPaid || 0,
        balance: p.lineItem!.amountDue - (p.lineItem!.amountPaid || 0),
      }));

    months.push({
      month: monthStr,
      year,
      monthName: monthNames[month],
      entries,
    });
  }

  return months;
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
