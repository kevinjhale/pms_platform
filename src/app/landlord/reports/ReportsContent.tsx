'use client';

import Link from "next/link";
import { CardSizeProvider, CardSizeToggle, useCardSize } from "@/components/CardSizeToggle";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DateRangeSelector } from "@/components/MonthYearSelector";
import {
  RevenueChart,
  PaymentStatusChart,
  MaintenanceCategoryChart,
  OccupancyChart,
} from "@/components/charts";
import type { DashboardReport, MonthlyRevenueData } from "@/services/reports";
import type { RentRollEntry, MonthlyPaymentSummary } from "@/services/rentRoll";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  structural: "Structural",
  pest: "Pest Control",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  security: "Security",
  other: "Other",
};

interface ReportsContentProps {
  report: DashboardReport;
  revenueHistory: MonthlyRevenueData[];
  rentRoll: RentRollEntry[];
  rentRollTotals: {
    totalUnits: number;
    totalMonthlyRent: number;
    totalMonthlyCharges: number;
    totalBalance: number;
    totalSecurityDeposits: number;
    statusCounts: {
      current: number;
      partial: number;
      delinquent: number;
      eviction: number;
    };
  };
  monthlyPayments: MonthlyPaymentSummary[];
  currentYear: number;
  organizationName: string;
  dateRangeLabel: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: string | null, isCompact: boolean) {
  const styles: Record<string, { bg: string; color: string }> = {
    current: { bg: '#dcfce7', color: '#166534' },
    partial: { bg: '#fef9c3', color: '#854d0e' },
    delinquent: { bg: '#fee2e2', color: '#991b1b' },
    eviction: { bg: '#7f1d1d', color: '#ffffff' },
    prepaid: { bg: '#dbeafe', color: '#1e40af' },
  };
  const style = styles[status || 'current'] || styles.current;

  return (
    <span style={{
      padding: isCompact ? '0.125rem 0.375rem' : '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: isCompact ? '0.625rem' : '0.75rem',
      fontWeight: 500,
      backgroundColor: style.bg,
      color: style.color,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {status || 'current'}
    </span>
  );
}

function ReportsContentInner({
  report,
  revenueHistory,
  rentRoll,
  rentRollTotals,
  monthlyPayments,
  currentYear,
  organizationName,
  dateRangeLabel,
  startMonth,
  startYear,
  endMonth,
  endYear,
}: ReportsContentProps) {
  const { size } = useCardSize();
  const isCompact = size === 'compact';

  // Size-dependent styles
  const cardPadding = isCompact ? '0.75rem' : '1.5rem';
  const metricFontSize = isCompact ? '1.5rem' : '2.5rem';
  const smallMetricFontSize = isCompact ? '1.25rem' : '1.75rem';
  const labelFontSize = isCompact ? '0.7rem' : '0.875rem';
  const gridGap = isCompact ? '0.75rem' : '1rem';
  const chartHeight = isCompact ? 180 : 300;

  // Rent Roll table rows definition
  const rentRollRows = [
    { label: 'Property', key: 'property' },
    { label: 'Unit', key: 'unit' },
    { label: 'Tenant', key: 'tenant' },
    { label: 'Rent', key: 'rent' },
    { label: 'Total Monthly', key: 'totalMonthly' },
    { label: 'Balance', key: 'balance' },
    { label: 'Status', key: 'status' },
    { label: 'Lease End', key: 'leaseEnd' },
  ];

  const monthAbbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getRentRollCellValue = (key: string, entry: RentRollEntry) => {
    switch (key) {
      case 'property':
        return (
          <Link href={`/landlord/properties/${entry.propertyId}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            {entry.propertyName}
          </Link>
        );
      case 'unit':
        return entry.unitNumber || '-';
      case 'tenant':
        return entry.tenantName || 'Unknown';
      case 'rent':
        return formatCurrency(entry.monthlyRent);
      case 'totalMonthly':
        return <span style={{ fontWeight: 500 }}>{formatCurrency(entry.totalMonthlyCharges)}</span>;
      case 'balance':
        return (
          <span style={{
            fontWeight: entry.currentBalance !== 0 ? 500 : 400,
            color: entry.currentBalance > 0 ? '#dc2626' : entry.currentBalance < 0 ? '#166534' : 'inherit',
          }}>
            {formatCurrency(entry.currentBalance)}
          </span>
        );
      case 'status':
        return getStatusBadge(entry.paymentStatus, isCompact);
      case 'leaseEnd':
        return formatDate(entry.endDate);
      default:
        return '-';
    }
  };

  const getMonthPayment = (leaseId: string, monthIndex: number) => {
    const monthData = monthlyPayments[monthIndex];
    if (!monthData) return null;
    const leaseEntries = monthData.entries.filter(e => e.leaseId === leaseId);
    if (leaseEntries.length === 0) return null;
    const totalPaid = leaseEntries.reduce((sum, e) => sum + e.amountPaid, 0);
    const totalDue = leaseEntries.reduce((sum, e) => sum + e.amountDue, 0);
    return { paid: totalPaid, balance: totalDue - totalPaid };
  };

  return (
    <main className="container" style={{ paddingTop: isCompact ? '2rem' : '4rem', paddingBottom: isCompact ? '2rem' : '4rem' }}>
      <div style={{ marginBottom: isCompact ? '1rem' : '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
          <div>
            <h1 style={{ fontSize: isCompact ? '1.75rem' : '2.5rem', fontWeight: 'bold' }}>Reports & Analytics</h1>
            <p style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>
              Key metrics for {organizationName} - {dateRangeLabel}
            </p>
          </div>
          <CardSizeToggle />
        </div>
        <DateRangeSelector
          startMonth={startMonth}
          startYear={startYear}
          endMonth={endMonth}
          endYear={endYear}
          isCompact={isCompact}
        />
      </div>

      {/* Occupancy Section */}
      <CollapsibleSection title="Occupancy Overview" storageKey="reports-occupancy" isCompact={isCompact}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '120px' : '180px'}, 1fr))`,
            gap: gridGap,
          }}
        >
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: metricFontSize, fontWeight: 'bold', color: 'var(--primary)' }}>
              {report.occupancy.occupancyRate}%
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Occupancy Rate</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: metricFontSize, fontWeight: 'bold' }}>
              {report.occupancy.totalUnits}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Total Units</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: metricFontSize, fontWeight: 'bold', color: '#15803d' }}>
              {report.occupancy.occupiedUnits}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Occupied</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: metricFontSize, fontWeight: 'bold', color: '#dc2626' }}>
              {report.occupancy.vacantUnits}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Vacant</div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Visual Charts Section */}
      <CollapsibleSection title="Visual Analytics" storageKey="reports-charts" isCompact={isCompact}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '280px' : '400px'}, 1fr))`,
            gap: isCompact ? '1rem' : '1.5rem',
          }}
        >
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Revenue Trend (6 months)
            </h3>
            <RevenueChart data={revenueHistory} height={chartHeight} />
          </div>
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Occupancy Status
            </h3>
            <OccupancyChart
              occupied={report.occupancy.occupiedUnits}
              vacant={report.occupancy.vacantUnits}
              occupancyRate={report.occupancy.occupancyRate}
              height={isCompact ? 140 : 200}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: isCompact ? '1rem' : '2rem', marginTop: '0.5rem', fontSize: isCompact ? '0.75rem' : '0.875rem' }}>
              <span><span style={{ color: '#22c55e' }}>●</span> Occupied: {report.occupancy.occupiedUnits}</span>
              <span><span style={{ color: '#ef4444' }}>●</span> Vacant: {report.occupancy.vacantUnits}</span>
            </div>
          </div>
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Payment Status Distribution
            </h3>
            <PaymentStatusChart data={rentRollTotals.statusCounts} height={isCompact ? 180 : 250} />
          </div>
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Open Maintenance by Category
            </h3>
            <MaintenanceCategoryChart data={report.maintenance.byCategory} height={isCompact ? 180 : 250} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Revenue Section */}
      <CollapsibleSection title={`Revenue - ${dateRangeLabel}`} storageKey="reports-revenue" isCompact={isCompact}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '120px' : '180px'}, 1fr))`,
            gap: gridGap,
          }}
        >
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold' }}>
              ${centsToDollars(report.revenue.expectedMonthly).toLocaleString()}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Expected</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold', color: '#15803d' }}>
              ${centsToDollars(report.revenue.collectedThisMonth).toLocaleString()}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Collected</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold', color: '#dc2626' }}>
              ${centsToDollars(report.revenue.outstandingBalance).toLocaleString()}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Outstanding</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold', color: 'var(--primary)' }}>
              {report.revenue.collectionRate}%
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Collection Rate</div>
          </div>
        </div>
        {report.revenue.overdueCount > 0 && (
          <div
            style={{
              marginTop: isCompact ? '0.5rem' : '1rem',
              padding: isCompact ? '0.5rem 0.75rem' : '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              borderRadius: 'var(--radius)',
              color: '#991b1b',
              fontSize: isCompact ? '0.75rem' : '0.875rem',
            }}
          >
            {report.revenue.overdueCount} payment{report.revenue.overdueCount !== 1 ? 's' : ''} overdue
          </div>
        )}
      </CollapsibleSection>

      {/* Rent Roll Section */}
      <CollapsibleSection title="Rent Roll" storageKey="reports-rentroll" defaultOpen={false} isCompact={isCompact}>
        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '140px' : '180px'}, 1fr))`,
          gap: gridGap,
          marginBottom: isCompact ? '1rem' : '1.5rem',
        }}>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold' }}>{rentRollTotals.totalUnits}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Total Units</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold' }}>{formatCurrency(rentRollTotals.totalMonthlyRent)}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Monthly Rent</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold' }}>{formatCurrency(rentRollTotals.totalMonthlyCharges)}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Total Monthly</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center', backgroundColor: rentRollTotals.totalBalance > 0 ? '#fef2f2' : undefined }}>
            <div style={{ fontSize: smallMetricFontSize, fontWeight: 'bold', color: rentRollTotals.totalBalance > 0 ? '#dc2626' : 'inherit' }}>
              {formatCurrency(rentRollTotals.totalBalance)}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Outstanding</div>
          </div>
        </div>

        {rentRoll.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--secondary)' }}>No active leases. Create leases to see your rent roll.</p>
          </div>
        ) : (
          <>
            {/* Rent Roll Table */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: isCompact ? '1rem' : '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: isCompact ? '0.75rem' : '0.875rem', minWidth: 'max-content' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'left', fontWeight: 600, backgroundColor: 'var(--border)', position: 'sticky', left: 0, zIndex: 10, minWidth: '100px' }}>
                        Field
                      </th>
                      {rentRoll.map((entry) => (
                        <th key={entry.leaseId} style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'left', fontWeight: 600, backgroundColor: 'var(--border)', minWidth: '140px', whiteSpace: 'nowrap' }}>
                          {entry.propertyName}{entry.unitNumber && ` #${entry.unitNumber}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rentRollRows.map((row, rowIndex) => (
                      <tr key={row.key} style={{ backgroundColor: rowIndex % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', fontWeight: 500, backgroundColor: rowIndex % 2 === 0 ? 'var(--surface)' : 'rgba(0,0,0,0.02)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 5 }}>
                          {row.label}
                        </td>
                        {rentRoll.map((entry) => (
                          <td key={entry.leaseId} style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                            {getRentRollCellValue(row.key, entry)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Payments Table */}
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: 600, marginBottom: isCompact ? '0.5rem' : '0.75rem' }}>
              Monthly Payments - {currentYear}
            </h3>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: isCompact ? '0.75rem' : '0.875rem', minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'left', fontWeight: 600, backgroundColor: 'var(--border)', position: 'sticky', left: 0, zIndex: 10, minWidth: '120px' }}>
                        Property
                      </th>
                      {monthAbbrev.map((month) => (
                        <th key={month} style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'right', fontWeight: 600, backgroundColor: 'var(--border)', minWidth: isCompact ? '60px' : '80px' }}>
                          {month}
                        </th>
                      ))}
                      <th style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'right', fontWeight: 600, backgroundColor: 'var(--border)', minWidth: '80px', borderLeft: '2px solid #9ca3af' }}>
                        YTD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentRoll.map((entry, rowIndex) => {
                      let ytdTotal = 0;
                      const monthValues = monthAbbrev.map((_, idx) => {
                        const payment = getMonthPayment(entry.leaseId, idx);
                        if (payment) ytdTotal += payment.paid;
                        return payment;
                      });
                      return (
                        <tr key={entry.leaseId} style={{ backgroundColor: rowIndex % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                          <td style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', fontWeight: 500, backgroundColor: rowIndex % 2 === 0 ? 'var(--surface)' : 'rgba(0,0,0,0.02)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 5, whiteSpace: 'nowrap' }}>
                            {entry.propertyName}{entry.unitNumber && ` #${entry.unitNumber}`}
                          </td>
                          {monthValues.map((payment, idx) => (
                            <td key={idx} style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'right', borderTop: '1px solid var(--border)', color: payment ? (payment.balance > 0 ? '#dc2626' : payment.paid > 0 ? '#166534' : 'var(--secondary)') : 'var(--secondary)' }}>
                              {payment ? formatCurrency(payment.paid) : '-'}
                            </td>
                          ))}
                          <td style={{ padding: isCompact ? '0.5rem' : '0.75rem 1rem', textAlign: 'right', fontWeight: 600, borderTop: '1px solid var(--border)', borderLeft: '2px solid #9ca3af' }}>
                            {formatCurrency(ytdTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Maintenance & Leases Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: isCompact ? '0' : '1rem' }}>
        {/* Maintenance Section */}
        <CollapsibleSection title="Maintenance" storageKey="reports-maintenance" isCompact={isCompact}>
          <div className="card" style={{ padding: cardPadding }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isCompact ? '0.5rem' : '1rem', marginBottom: isCompact ? '0.75rem' : '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#dc2626' }}>{report.maintenance.openRequests}</div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Open</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#1d4ed8' }}>{report.maintenance.inProgressRequests}</div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>In Progress</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#15803d' }}>{report.maintenance.completedThisMonth}</div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Completed This Month</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold' }}>{report.maintenance.avgCompletionDays}</div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Avg Days to Complete</div>
              </div>
            </div>
            {Object.keys(report.maintenance.byCategory).length > 0 && (
              <>
                <h3 style={{ fontSize: isCompact ? '0.75rem' : '0.875rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '0.75rem', color: 'var(--secondary)' }}>
                  Open Requests by Category
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '0.25rem' : '0.5rem' }}>
                  {Object.entries(report.maintenance.byCategory).sort((a, b) => b[1] - a[1]).map(([category, count]) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: isCompact ? '0.75rem' : '0.875rem' }}>
                      <span>{CATEGORY_LABELS[category] || category}</span>
                      <span style={{ fontWeight: '500' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Link href="/landlord/maintenance" className="btn" style={{ marginTop: isCompact ? '0.5rem' : '1rem', width: '100%', textAlign: 'center', border: '1px solid var(--border)', textDecoration: 'none', padding: isCompact ? '0.375rem' : '0.5rem', fontSize: isCompact ? '0.8rem' : '1rem' }}>
              View All Requests
            </Link>
          </div>
        </CollapsibleSection>

        {/* Leases Section */}
        <CollapsibleSection title="Lease Expirations" storageKey="reports-leases" isCompact={isCompact}>
          <div className="card" style={{ padding: cardPadding }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isCompact ? '0.5rem' : '1rem', marginBottom: isCompact ? '0.75rem' : '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#fef2f2', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{report.leases.expiringIn30Days}</div>
                <div style={{ fontSize: isCompact ? '0.6rem' : '0.7rem', color: '#991b1b' }}>30 Days</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#92400e' }}>{report.leases.expiringIn60Days}</div>
                <div style={{ fontSize: isCompact ? '0.6rem' : '0.7rem', color: '#92400e' }}>60 Days</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{report.leases.expiringIn90Days}</div>
                <div style={{ fontSize: isCompact ? '0.6rem' : '0.7rem', color: '#15803d' }}>90 Days</div>
              </div>
            </div>
            {report.leases.upcomingExpirations.length > 0 ? (
              <>
                <h3 style={{ fontSize: isCompact ? '0.75rem' : '0.875rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '0.75rem', color: 'var(--secondary)' }}>
                  Upcoming Expirations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '0.25rem' : '0.5rem' }}>
                  {report.leases.upcomingExpirations.slice(0, isCompact ? 3 : 5).map((lease) => (
                    <Link key={lease.leaseId} href={`/landlord/leases/${lease.leaseId}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: isCompact ? '0.75rem' : '0.875rem', padding: isCompact ? '0.375rem' : '0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', textDecoration: 'none', color: 'inherit' }}>
                      <span>
                        {lease.tenantName}
                        <span style={{ color: 'var(--secondary)', marginLeft: '0.5rem', fontSize: isCompact ? '0.7rem' : '0.875rem' }}>
                          {lease.propertyName}{lease.unitNumber && ` #${lease.unitNumber}`}
                        </span>
                      </span>
                      <span style={{ fontWeight: '500', color: lease.daysUntilExpiry <= 30 ? '#dc2626' : lease.daysUntilExpiry <= 60 ? '#92400e' : '#15803d' }}>
                        {lease.daysUntilExpiry}d
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--secondary)', fontSize: isCompact ? '0.75rem' : '0.875rem' }}>
                No leases expiring in the next 90 days.
              </p>
            )}
            <Link href="/landlord/leases" className="btn" style={{ marginTop: isCompact ? '0.5rem' : '1rem', width: '100%', textAlign: 'center', border: '1px solid var(--border)', textDecoration: 'none', padding: isCompact ? '0.375rem' : '0.5rem', fontSize: isCompact ? '0.8rem' : '1rem' }}>
              View All Leases
            </Link>
          </div>
        </CollapsibleSection>
      </div>

      {/* Applications Section */}
      <CollapsibleSection title={`Applications - ${dateRangeLabel}`} storageKey="reports-applications" isCompact={isCompact}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '120px' : '180px'}, 1fr))`,
            gap: gridGap,
          }}
        >
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{report.applications.pendingApplications}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Pending Review</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#15803d' }}>{report.applications.approvedThisMonth}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Approved</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#dc2626' }}>{report.applications.rejectedThisMonth}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Rejected</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold' }}>{report.applications.avgProcessingDays}</div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Avg Processing Days</div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div
        style={{
          marginTop: isCompact ? '1rem' : '2rem',
          padding: isCompact ? '0.5rem' : '1rem',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius)',
          fontSize: isCompact ? '0.625rem' : '0.75rem',
          color: 'var(--secondary)',
          textAlign: 'center',
        }}
      >
        Report generated at {report.generatedAt.toLocaleString()}
      </div>
    </main>
  );
}

export default function ReportsContent(props: ReportsContentProps) {
  return (
    <CardSizeProvider>
      <ReportsContentInner {...props} />
    </CardSizeProvider>
  );
}
