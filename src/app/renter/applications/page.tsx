import { auth } from '@/lib/auth';
import { getApplicationsByApplicant } from '@/services/applications';
import Link from 'next/link';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#4b5563' },
  submitted: { bg: '#fef3c7', text: '#92400e' },
  under_review: { bg: '#dbeafe', text: '#1e40af' },
  approved: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fecaca', text: '#dc2626' },
  withdrawn: { bg: '#f3f4f6', text: '#6b7280' },
};

export default async function RenterApplicationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const applications = userId ? await getApplicationsByApplicant(userId) : [];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>My Applications</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        Track the status of your rental applications.
      </p>

      {applications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>No applications yet</h3>
          <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            Browse available listings to find your next home.
          </p>
          <Link href="/renter/browse" className="btn btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => {
            const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.draft;
            return (
              <div
                key={app.id}
                className="card"
                style={{ padding: '1.25rem' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>
                      {app.unitTitle}
                    </h3>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
                      {app.propertyAddress}
                    </p>
                  </div>
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
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--secondary)',
                  }}
                >
                  <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.status === 'approved' && (
                    <span style={{ color: '#166534', fontWeight: 500 }}>
                      Approved - Check your lease
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
