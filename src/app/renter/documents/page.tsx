import { auth } from '@/lib/auth';
import { getLeasesByTenant } from '@/services/leases';

export default async function RenterDocumentsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const leases = userId ? await getLeasesByTenant(userId) : [];
  const activeLease = leases.find((l) => l.status === 'active');

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Documents</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        Access your lease documents and important files.
      </p>

      {activeLease ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Lease Agreement */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#e0e7ff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                📄
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>Lease Agreement</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  {activeLease.propertyName}
                  {activeLease.unitNumber && ` - Unit ${activeLease.unitNumber}`}
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>
              Coming Soon
            </button>
          </div>

          {/* Move-in Checklist */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>Move-in Checklist</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  Inspection report and condition documentation
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>
              Coming Soon
            </button>
          </div>

          {/* Renter's Insurance */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                🛡️
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>Renter's Insurance</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  Upload your insurance documents
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>
              Coming Soon
            </button>
          </div>
        </div>
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
          <h3 style={{ marginBottom: '0.5rem' }}>No documents available</h3>
          <p style={{ color: 'var(--secondary)' }}>
            Documents will appear here once you have an active lease.
          </p>
        </div>
      )}
    </div>
  );
}
