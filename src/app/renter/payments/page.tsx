import { auth } from '@/lib/auth';
import { getLeasesByTenant, getPaymentsByLease } from '@/services/leases';
import { centsToDollars } from '@/lib/utils';
import PayButton from '@/components/PayButton';

const isStripeEnabled = !!process.env.STRIPE_PUBLISHABLE_KEY;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  upcoming: { bg: '#e0e7ff', text: '#3730a3' },
  due: { bg: '#fed7aa', text: '#c2410c' },
  paid: { bg: '#dcfce7', text: '#166534' },
  late: { bg: '#fecaca', text: '#dc2626' },
  partial: { bg: '#fef3c7', text: '#92400e' },
};

export default async function RenterPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; payment?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const params = await searchParams;

  const leases = userId ? await getLeasesByTenant(userId) : [];
  const activeLease = leases.find((l) => l.status === 'active');

  let payments: Awaited<ReturnType<typeof getPaymentsByLease>> = [];
  if (activeLease) {
    payments = await getPaymentsByLease(activeLease.id);
  }

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  const totalDue = payments
    .filter((p) => p.status === 'due' || p.status === 'late')
    .reduce((sum, p) => sum + p.amountDue - (p.amountPaid || 0), 0);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Payments</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        View your rent payment history and upcoming payments.
      </p>

      {/* Success/Cancelled Messages */}
      {params.success && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#dcfce7',
            borderRadius: 'var(--radius)',
            color: '#166534',
          }}
        >
          Payment successful! Your payment has been processed.
        </div>
      )}
      {params.cancelled && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fef3c7',
            borderRadius: 'var(--radius)',
            color: '#92400e',
          }}
        >
          Payment was cancelled. You can try again when ready.
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#dcfce7',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.25rem' }}>
            Total Paid
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#166534' }}>
            ${centsToDollars(totalPaid).toLocaleString()}
          </div>
        </div>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: totalDue > 0 ? '#fef3c7' : '#f3f4f6',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: totalDue > 0 ? '#92400e' : '#6b7280', marginBottom: '0.25rem' }}>
            Amount Due
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalDue > 0 ? '#92400e' : '#6b7280' }}>
            ${centsToDollars(totalDue).toLocaleString()}
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>No payment history</h3>
          <p style={{ color: 'var(--secondary)' }}>
            Payment records will appear here once you have an active lease.
          </p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Payment History</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Due Date</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Paid Date</th>
                  {isStripeEnabled && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const statusColor = STATUS_COLORS[payment.status] || STATUS_COLORS.upcoming;
                  return (
                    <tr key={payment.id}>
                      <td>
                        {new Date(payment.periodStart).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                      <td>${centsToDollars(payment.amountDue).toLocaleString()}</td>
                      <td>
                        {payment.amountPaid
                          ? `$${centsToDollars(payment.amountPaid).toLocaleString()}`
                          : '-'}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {isStripeEnabled && (payment.status === 'due' || payment.status === 'late' || payment.status === 'upcoming') && (
                          <PayButton
                            paymentId={payment.id}
                            amountDue={payment.amountDue - (payment.amountPaid || 0)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
