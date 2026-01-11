'use client';

import Link from "next/link";
import { CardSizeProvider, CardSizeToggle, useCardSize } from "@/components/CardSizeToggle";
import {
  RevenueChart,
  PaymentStatusChart,
  MaintenanceCategoryChart,
  OccupancyChart,
} from "@/components/charts";
import type { DashboardReport, MonthlyRevenueData } from "@/services/reports";

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
  organizationName: string;
  currentMonth: string;
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

function ReportsContentInner({
  report,
  revenueHistory,
  rentRollTotals,
  organizationName,
  currentMonth,
}: ReportsContentProps) {
  const { size } = useCardSize();
  const isCompact = size === 'compact';

  // Size-dependent styles
  const cardPadding = isCompact ? '0.75rem' : '1.5rem';
  const metricFontSize = isCompact ? '1.5rem' : '2.5rem';
  const smallMetricFontSize = isCompact ? '1.25rem' : '1.75rem';
  const labelFontSize = isCompact ? '0.7rem' : '0.875rem';
  const sectionMargin = isCompact ? '1.5rem' : '2.5rem';
  const gridGap = isCompact ? '0.75rem' : '1rem';
  const chartHeight = isCompact ? 180 : 300;

  return (
    <main className="container" style={{ paddingTop: isCompact ? '2rem' : '4rem', paddingBottom: isCompact ? '2rem' : '4rem' }}>
      <div style={{ marginBottom: isCompact ? '1rem' : '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: isCompact ? '1.75rem' : '2.5rem', fontWeight: 'bold' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>
            Key metrics for {organizationName} - {currentMonth}
          </p>
        </div>
        <CardSizeToggle />
      </div>

      {/* Occupancy Section */}
      <section style={{ marginBottom: sectionMargin }}>
        <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
          Occupancy Overview
        </h2>
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
      </section>

      {/* Visual Charts Section */}
      <section style={{ marginBottom: sectionMargin }}>
        <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
          Visual Analytics
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '280px' : '400px'}, 1fr))`,
            gap: isCompact ? '1rem' : '1.5rem',
          }}
        >
          {/* Revenue Trend Chart */}
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Revenue Trend (6 months)
            </h3>
            <RevenueChart data={revenueHistory} height={chartHeight} />
          </div>

          {/* Occupancy Donut */}
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
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isCompact ? '1rem' : '2rem',
              marginTop: '0.5rem',
              fontSize: isCompact ? '0.75rem' : '0.875rem'
            }}>
              <span><span style={{ color: '#22c55e' }}>●</span> Occupied: {report.occupancy.occupiedUnits}</span>
              <span><span style={{ color: '#ef4444' }}>●</span> Vacant: {report.occupancy.vacantUnits}</span>
            </div>
          </div>

          {/* Payment Status Distribution */}
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Payment Status Distribution
            </h3>
            <PaymentStatusChart data={rentRollTotals.statusCounts} height={isCompact ? 180 : 250} />
          </div>

          {/* Maintenance by Category */}
          <div className="card" style={{ padding: cardPadding }}>
            <h3 style={{ fontSize: isCompact ? '0.875rem' : '1rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
              Open Maintenance by Category
            </h3>
            <MaintenanceCategoryChart data={report.maintenance.byCategory} height={isCompact ? 180 : 250} />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section style={{ marginBottom: sectionMargin }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <Link
            href="/landlord/reports/rent-roll"
            className="btn btn-primary"
            style={{ textDecoration: 'none', padding: isCompact ? '0.375rem 0.75rem' : '0.5rem 1rem', fontSize: isCompact ? '0.8rem' : '1rem' }}
          >
            View Rent Roll
          </Link>
        </div>
      </section>

      {/* Revenue Section */}
      <section style={{ marginBottom: sectionMargin }}>
        <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
          Revenue - {currentMonth}
        </h2>
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
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: isCompact ? '1rem' : '2rem' }}>
        {/* Maintenance Section */}
        <section>
          <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
            Maintenance
          </h2>
          <div className="card" style={{ padding: cardPadding }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isCompact ? '0.5rem' : '1rem', marginBottom: isCompact ? '0.75rem' : '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {report.maintenance.openRequests}
                </div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Open</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                  {report.maintenance.inProgressRequests}
                </div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>In Progress</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#15803d' }}>
                  {report.maintenance.completedThisMonth}
                </div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Completed This Month</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold' }}>
                  {report.maintenance.avgCompletionDays}
                </div>
                <div style={{ fontSize: isCompact ? '0.625rem' : '0.75rem', color: 'var(--secondary)' }}>Avg Days to Complete</div>
              </div>
            </div>

            {Object.keys(report.maintenance.byCategory).length > 0 && (
              <>
                <h3 style={{ fontSize: isCompact ? '0.75rem' : '0.875rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '0.75rem', color: 'var(--secondary)' }}>
                  Open Requests by Category
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '0.25rem' : '0.5rem' }}>
                  {Object.entries(report.maintenance.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div
                        key={category}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: isCompact ? '0.75rem' : '0.875rem',
                        }}
                      >
                        <span>{CATEGORY_LABELS[category] || category}</span>
                        <span style={{ fontWeight: '500' }}>{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}

            <Link
              href="/landlord/maintenance"
              className="btn"
              style={{
                marginTop: isCompact ? '0.5rem' : '1rem',
                width: '100%',
                textAlign: 'center',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                padding: isCompact ? '0.375rem' : '0.5rem',
                fontSize: isCompact ? '0.8rem' : '1rem',
              }}
            >
              View All Requests
            </Link>
          </div>
        </section>

        {/* Leases Section */}
        <section>
          <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
            Lease Expirations
          </h2>
          <div className="card" style={{ padding: cardPadding }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isCompact ? '0.5rem' : '1rem', marginBottom: isCompact ? '0.75rem' : '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#fef2f2', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {report.leases.expiringIn30Days}
                </div>
                <div style={{ fontSize: isCompact ? '0.6rem' : '0.7rem', color: '#991b1b' }}>30 Days</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                  {report.leases.expiringIn60Days}
                </div>
                <div style={{ fontSize: isCompact ? '0.6rem' : '0.7rem', color: '#92400e' }}>60 Days</div>
              </div>
              <div style={{ textAlign: 'center', padding: isCompact ? '0.5rem' : '1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: isCompact ? '1rem' : '1.5rem', fontWeight: 'bold', color: '#15803d' }}>
                  {report.leases.expiringIn90Days}
                </div>
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
                    <Link
                      key={lease.leaseId}
                      href={`/landlord/leases/${lease.leaseId}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: isCompact ? '0.75rem' : '0.875rem',
                        padding: isCompact ? '0.375rem' : '0.5rem',
                        backgroundColor: 'var(--surface)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span>
                        {lease.tenantName}
                        <span style={{ color: 'var(--secondary)', marginLeft: '0.5rem', fontSize: isCompact ? '0.7rem' : '0.875rem' }}>
                          {lease.propertyName}{lease.unitNumber && ` #${lease.unitNumber}`}
                        </span>
                      </span>
                      <span
                        style={{
                          fontWeight: '500',
                          color: lease.daysUntilExpiry <= 30 ? '#dc2626' : lease.daysUntilExpiry <= 60 ? '#92400e' : '#15803d',
                        }}
                      >
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

            <Link
              href="/landlord/leases"
              className="btn"
              style={{
                marginTop: isCompact ? '0.5rem' : '1rem',
                width: '100%',
                textAlign: 'center',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                padding: isCompact ? '0.375rem' : '0.5rem',
                fontSize: isCompact ? '0.8rem' : '1rem',
              }}
            >
              View All Leases
            </Link>
          </div>
        </section>
      </div>

      {/* Applications Section */}
      <section style={{ marginTop: isCompact ? '1rem' : '2rem' }}>
        <h2 style={{ fontSize: isCompact ? '1rem' : '1.25rem', fontWeight: '600', marginBottom: isCompact ? '0.5rem' : '1rem' }}>
          Applications - {currentMonth}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isCompact ? '120px' : '180px'}, 1fr))`,
            gap: gridGap,
          }}
        >
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {report.applications.pendingApplications}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Pending Review</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#15803d' }}>
              {report.applications.approvedThisMonth}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Approved</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {report.applications.rejectedThisMonth}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Rejected</div>
          </div>
          <div className="card" style={{ padding: cardPadding, textAlign: 'center' }}>
            <div style={{ fontSize: isCompact ? '1.25rem' : '2rem', fontWeight: 'bold' }}>
              {report.applications.avgProcessingDays}
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: labelFontSize }}>Avg Processing Days</div>
          </div>
        </div>
      </section>

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
