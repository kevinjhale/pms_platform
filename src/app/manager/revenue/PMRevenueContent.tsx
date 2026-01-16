'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PMRevenueChart } from '@/components/charts';
import type {
  PMRevenueByProperty,
  PMRevenueSummary,
  PMRevenueByMonth,
} from '@/services/pmRevenue';

interface PMRevenueContentProps {
  summary: PMRevenueSummary;
  byProperty: PMRevenueByProperty[];
  byMonth: PMRevenueByMonth[];
  year: number;
  currentYear: number;
  userName: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function PMRevenueContent({
  summary,
  byProperty,
  byMonth,
  year,
  currentYear,
  userName,
}: PMRevenueContentProps) {
  const router = useRouter();

  const handleYearChange = (newYear: number) => {
    router.push(`/manager/revenue?year=${newYear}`);
  };

  const handleExportCSV = () => {
    const headers = ['Property', 'Address', 'Split %', 'Total Collected', 'Your Share', 'Payments'];
    const rows = byProperty.map(p => [
      p.propertyName,
      p.propertyAddress,
      `${p.splitPercentage}%`,
      formatCurrency(p.totalCollected),
      formatCurrency(p.pmShare),
      p.paymentCount.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pm-revenue-${year}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Year options for dropdown
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Calculate YTD PM share for the current year
  const ytdPMShare = byMonth.reduce((sum, m) => sum + m.pmShare, 0);

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Revenue Dashboard
        </h1>
        <p style={{ color: 'var(--secondary)' }}>
          Track your earnings as a property manager
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
            {formatCurrency(summary.totalPMShare)}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Total Earnings (All Time)
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {formatCurrency(summary.totalCollected)}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Total Rent Collected
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {summary.propertyCount}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Properties Managed
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.paymentCount}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Total Payments
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            Monthly Revenue - {year}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="year-select" style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
              Year:
            </label>
            <select
              id="year-select"
              value={year}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                fontSize: '0.875rem',
              }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        {byMonth.some(m => m.pmShare > 0) ? (
          <>
            <PMRevenueChart data={byMonth} height={300} />
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>YTD Total Collected:</span>{' '}
                <span style={{ fontWeight: '600' }}>
                  {formatCurrency(byMonth.reduce((sum, m) => sum + m.totalCollected, 0))}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>YTD Your Share:</span>{' '}
                <span style={{ fontWeight: '600', color: '#22c55e' }}>
                  {formatCurrency(ytdPMShare)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--secondary)',
          }}>
            No revenue data for {year}. Payments will appear here once tenants pay rent on your managed properties.
          </div>
        )}
      </div>

      {/* Revenue by Property */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            Revenue by Property
          </h2>
          {byProperty.length > 0 && (
            <button
              onClick={handleExportCSV}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Export CSV
            </button>
          )}
        </div>

        {byProperty.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--secondary)',
          }}>
            <p style={{ marginBottom: '1rem' }}>You don't have any active property assignments yet.</p>
            <Link
              href="/landlord/assignments"
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
              }}
            >
              View pending assignments
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Property</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Split %</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Total Collected</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Your Share</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Payments</th>
                </tr>
              </thead>
              <tbody>
                {byProperty.map((property, idx) => (
                  <tr
                    key={property.propertyId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <Link
                        href={`/landlord/properties/${property.propertyId}`}
                        style={{
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontWeight: '500',
                        }}
                      >
                        {property.propertyName}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        {property.propertyAddress}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: 'var(--surface)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {property.splitPercentage}%
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatCurrency(property.totalCollected)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#22c55e' }}>
                      {formatCurrency(property.pmShare)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--secondary)' }}>
                      {property.paymentCount}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: '600' }}>
                  <td style={{ padding: '0.75rem' }}>Total</td>
                  <td style={{ padding: '0.75rem' }}></td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatCurrency(summary.totalCollected)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#22c55e' }}>
                    {formatCurrency(summary.totalPMShare)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--secondary)' }}>
                    {summary.paymentCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
