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
      whiteSpace: 'nowrap',
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

  // Define the rows for the transposed table
  const rows = [
    { label: 'Property', key: 'property' },
    { label: 'Address', key: 'address' },
    { label: 'APN', key: 'apn' },
    { label: 'Unit', key: 'unit' },
    { label: 'Tenant', key: 'tenant' },
    { label: 'Co-Signer', key: 'cosigner' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Rent', key: 'rent' },
    { label: 'Water & Trash', key: 'waterTrash' },
    { label: 'Electricity', key: 'electricity' },
    { label: 'Total Monthly', key: 'totalMonthly' },
    { label: 'Security Deposit', key: 'deposit' },
    { label: 'Cleaning Fee', key: 'cleaningFee' },
    { label: 'Current Balance', key: 'balance' },
    { label: 'Status', key: 'status' },
    { label: 'Listed Date', key: 'listedDate' },
    { label: 'Lease Start', key: 'leaseStart' },
    { label: 'Lease End', key: 'leaseEnd' },
  ];

  // Helper to get cell value for each row/entry combination
  const getCellValue = (key: string, entry: typeof rentRoll[0]) => {
    switch (key) {
      case 'property':
        return <span style={{ fontWeight: 500 }}>{entry.propertyName}</span>;
      case 'address':
        return entry.address;
      case 'apn':
        return entry.apn || '-';
      case 'unit':
        return entry.unitNumber || '-';
      case 'tenant':
        return entry.tenantName || 'Unknown';
      case 'cosigner':
        return entry.coSignerName || '-';
      case 'email':
        return (
          <div>
            <div style={{ fontSize: '0.75rem' }}>{entry.tenantEmail}</div>
            {entry.coSignerEmail && (
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{entry.coSignerEmail}</div>
            )}
          </div>
        );
      case 'phone':
        return (
          <div>
            <div style={{ fontSize: '0.75rem' }}>{entry.tenantPhone || '-'}</div>
            {entry.coSignerPhone && (
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{entry.coSignerPhone}</div>
            )}
          </div>
        );
      case 'rent':
        return formatCurrency(entry.monthlyRent);
      case 'waterTrash':
        const waterCharge = entry.charges.find(c => c.category === 'water_trash');
        return waterCharge ? formatCurrency(waterCharge.amount) : '-';
      case 'electricity':
        const elecCharge = entry.charges.find(c => c.category === 'electricity');
        return elecCharge ? formatCurrency(elecCharge.amount) : '-';
      case 'totalMonthly':
        return <span style={{ fontWeight: 500 }}>{formatCurrency(entry.totalMonthlyCharges)}</span>;
      case 'deposit':
        return entry.securityDeposit ? formatCurrency(entry.securityDeposit) : '-';
      case 'cleaningFee':
        return entry.cleaningFee ? formatCurrency(entry.cleaningFee) : '-';
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
        return getStatusBadge(entry.paymentStatus);
      case 'listedDate':
        return formatDate(entry.listedDate);
      case 'leaseStart':
        return formatDate(entry.startDate);
      case 'leaseEnd':
        return formatDate(entry.endDate);
      default:
        return '-';
    }
  };

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
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Scrollable container with large scrollbar */}
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'auto',
              scrollbarColor: 'var(--border) var(--surface)',
            }}
            className="rent-roll-scroll"
          >
            <style>{`
              .rent-roll-scroll::-webkit-scrollbar {
                height: 16px;
              }
              .rent-roll-scroll::-webkit-scrollbar-track {
                background: var(--surface);
                border-top: 1px solid var(--border);
              }
              .rent-roll-scroll::-webkit-scrollbar-thumb {
                background: var(--border);
                border-radius: 8px;
                border: 3px solid var(--surface);
              }
              .rent-roll-scroll::-webkit-scrollbar-thumb:hover {
                background: var(--secondary);
              }
              /* Firefox */
              .rent-roll-scroll {
                scrollbar-width: auto;
              }
            `}</style>
            <table style={{
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              minWidth: 'max-content',
            }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    backgroundColor: 'var(--border)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    minWidth: '150px',
                  }}>
                    Field
                  </th>
                  {rentRoll.map((entry) => (
                    <th
                      key={entry.leaseId}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontWeight: 600,
                        backgroundColor: 'var(--border)',
                        minWidth: '180px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.propertyName}
                      {entry.unitNumber && ` #${entry.unitNumber}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.key} style={{
                    backgroundColor: rowIndex % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  }}>
                    <td style={{
                      padding: '0.75rem 1rem',
                      fontWeight: 500,
                      backgroundColor: rowIndex % 2 === 0 ? 'var(--surface)' : 'rgba(0,0,0,0.02)',
                      borderRight: '1px solid var(--border)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 5,
                    }}>
                      {row.label}
                    </td>
                    {rentRoll.map((entry) => (
                      <td
                        key={entry.leaseId}
                        style={{
                          padding: '0.75rem 1rem',
                          borderTop: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getCellValue(row.key, entry)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
