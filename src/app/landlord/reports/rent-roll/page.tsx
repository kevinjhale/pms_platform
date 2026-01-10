import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { getRentRoll, calculateRentRollTotals } from '@/services/rentRoll';
import Link from 'next/link';

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

function getStatusBadge(status: string | null) {
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
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      backgroundColor: style.bg,
      color: style.color,
      textTransform: 'capitalize',
    }}>
      {status || 'current'}
    </span>
  );
}

export default async function RentRollPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const rentRoll = await getRentRoll(organization.id);
  const totals = calculateRentRollTotals(rentRoll);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Rent Roll</h1>
          <p style={{ color: 'var(--secondary)' }}>
            Financial overview of all active leases
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/landlord/reports" style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
          }}>
            Back to Reports
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Total Units</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totals.totalUnits}</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Monthly Rent</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(totals.totalMonthlyRent)}</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Total Monthly</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(totals.totalMonthlyCharges)}</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: totals.totalBalance > 0 ? '#fef2f2' : 'var(--surface)',
          border: `1px solid ${totals.totalBalance > 0 ? '#fecaca' : 'var(--border)'}`,
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Outstanding Balance</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: totals.totalBalance > 0 ? '#dc2626' : 'inherit',
          }}>
            {formatCurrency(totals.totalBalance)}
          </div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Security Deposits</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(totals.totalSecurityDeposits)}</div>
        </div>
      </div>

      {/* Status Summary */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Status:</span>
        <span style={{ fontSize: '0.875rem' }}>
          <span style={{ color: '#166534' }}>{totals.statusCounts.current} Current</span>
          {totals.statusCounts.partial > 0 && (
            <span style={{ color: '#854d0e', marginLeft: '1rem' }}>{totals.statusCounts.partial} Partial</span>
          )}
          {totals.statusCounts.delinquent > 0 && (
            <span style={{ color: '#991b1b', marginLeft: '1rem' }}>{totals.statusCounts.delinquent} Delinquent</span>
          )}
          {totals.statusCounts.eviction > 0 && (
            <span style={{ color: '#7f1d1d', marginLeft: '1rem' }}>{totals.statusCounts.eviction} Eviction</span>
          )}
        </span>
      </div>

      {rentRoll.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{ marginBottom: '0.5rem' }}>No active leases</h2>
          <p style={{ color: 'var(--secondary)' }}>
            Create leases to see your rent roll.
          </p>
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Property</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Unit</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Contact</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Rent</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Total</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Deposit</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Balance</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Lease Period</th>
              </tr>
            </thead>
            <tbody>
              {rentRoll.map((entry, index) => (
                <tr key={entry.leaseId} style={{
                  borderTop: '1px solid var(--border)',
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 500 }}>{entry.propertyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                      {entry.address}
                    </div>
                    {entry.apn && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        APN: {entry.apn}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {entry.unitNumber || '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{entry.tenantName || 'Unknown'}</div>
                    {entry.coSignerName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        Co-signer: {entry.coSignerName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem' }}>{entry.tenantEmail}</div>
                    {entry.tenantPhone && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        {entry.tenantPhone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {formatCurrency(entry.monthlyRent)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {formatCurrency(entry.totalMonthlyCharges)}
                    {entry.charges.length > 1 && (
                      <div style={{ fontSize: '0.625rem', color: 'var(--secondary)' }}>
                        +{entry.charges.length - 1} charges
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {entry.securityDeposit ? formatCurrency(entry.securityDeposit) : '-'}
                  </td>
                  <td style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'right',
                    color: entry.currentBalance > 0 ? '#dc2626' : entry.currentBalance < 0 ? '#166534' : 'inherit',
                    fontWeight: entry.currentBalance !== 0 ? 500 : 400,
                  }}>
                    {formatCurrency(entry.currentBalance)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {getStatusBadge(entry.paymentStatus)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem' }}>
                      {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                    </div>
                    {entry.listedDate && (
                      <div style={{ fontSize: '0.625rem', color: 'var(--secondary)' }}>
                        Listed: {formatDate(entry.listedDate)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
