import { auth } from '@/lib/auth';
import { getLeasesByTenant, getPaymentsByLease } from '@/services/leases';
import { centsToDollars } from '@/lib/utils';
import Link from 'next/link';

export default async function RenterLeasePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const leases = userId ? await getLeasesByTenant(userId) : [];
  const activeLease = leases.find((l) => l.status === 'active');
  const pastLeases = leases.filter((l) => l.status !== 'active');

  let payments: Awaited<ReturnType<typeof getPaymentsByLease>> = [];
  if (activeLease) {
    payments = await getPaymentsByLease(activeLease.id);
  }

  const upcomingPayments = payments.filter(
    (p) => p.status === 'upcoming' || p.status === 'due'
  );

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>My Lease</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        View your current lease details and history.
      </p>

      {activeLease ? (
        <>
          {/* Current Lease */}
          <div
            className="card"
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              border: '2px solid var(--primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  Active
                </span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {activeLease.propertyName}
                  {activeLease.unitNumber && ` - Unit ${activeLease.unitNumber}`}
                </h2>
                <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
                  {activeLease.propertyAddress}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                  ${centsToDollars(activeLease.monthlyRent).toLocaleString()}
                </div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>per month</div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Start Date
                </div>
                <div style={{ fontWeight: 500 }}>
                  {new Date(activeLease.startDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  End Date
                </div>
                <div style={{ fontWeight: 500 }}>
                  {new Date(activeLease.endDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Security Deposit
                </div>
                <div style={{ fontWeight: 500 }}>
                  ${centsToDollars(activeLease.securityDeposit || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Rent Due
                </div>
                <div style={{ fontWeight: 500 }}>
                  1st of each month
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          {upcomingPayments.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Upcoming Payments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingPayments.slice(0, 3).map((payment) => (
                  <div
                    key={payment.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: payment.status === 'due' ? '#fff7ed' : 'var(--surface)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {new Date(payment.periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                        ${centsToDollars(payment.amountDue).toLocaleString()}
                      </div>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          backgroundColor: payment.status === 'due' ? '#fed7aa' : '#e0e7ff',
                          color: payment.status === 'due' ? '#c2410c' : '#3730a3',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                        }}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/renter/payments"
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  color: 'var(--accent)',
                  fontSize: '0.875rem',
                }}
              >
                View all payments →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>No active lease</h3>
          <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            You don't have an active lease. Browse listings to find your next home.
          </p>
          <Link href="/renter/browse" className="btn btn-primary">
            Browse Listings
          </Link>
        </div>
      )}

      {/* Past Leases */}
      {pastLeases.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Lease History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastLeases.map((lease) => (
              <div
                key={lease.id}
                className="card"
                style={{ padding: '1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {lease.propertyName}
                      {lease.unitNumber && ` - Unit ${lease.unitNumber}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                      {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {lease.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
