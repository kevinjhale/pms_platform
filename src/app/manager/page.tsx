import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import {
  getPropertiesForManager,
  getPendingAssignmentsForManager,
} from '@/services/properties';
import { getPMRevenueSummary } from '@/services/pmRevenue';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default async function ManagerDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const [properties, pendingAssignments, revenueSummary] = await Promise.all([
    getPropertiesForManager(session.user.id, organization.id),
    getPendingAssignmentsForManager(session.user.id),
    getPMRevenueSummary(session.user.id),
  ]);

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Welcome, {session.user.name || 'Property Manager'}
        </h1>
        <p style={{ color: 'var(--secondary)' }}>
          Manage your assigned properties and track your earnings
        </p>
      </div>

      {/* Pending Assignments Alert */}
      {pendingAssignments.length > 0 && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#fef3c7',
          borderRadius: 'var(--radius)',
          border: '1px solid #fcd34d',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#92400e' }}>
                {pendingAssignments.length} Pending Assignment{pendingAssignments.length !== 1 ? 's' : ''}
              </strong>
              <p style={{ color: '#78350f', fontSize: '0.875rem', margin: 0 }}>
                You have property assignments waiting for your response
              </p>
            </div>
            <Link
              href="/landlord/assignments"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#92400e',
                color: 'white',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Review Assignments
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {properties.length}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Properties Managed
          </div>
          <Link
            href="/landlord/properties"
            style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            View Properties
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>
            {formatCurrency(revenueSummary.totalPMShare)}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Total Earnings
          </div>
          <Link
            href="/manager/revenue"
            style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            View Revenue Details
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {revenueSummary.paymentCount}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Total Payments Processed
          </div>
          <Link
            href="/manager/revenue"
            style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            View Details
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: pendingAssignments.length > 0 ? '#f59e0b' : 'var(--secondary)' }}>
            {pendingAssignments.length}
          </div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Pending Assignments
          </div>
          <Link
            href="/landlord/assignments"
            style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            Review Assignments
          </Link>
        </div>
      </div>

      {/* Properties List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Your Properties</h2>
          <Link
            href="/landlord/properties"
            style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            View All
          </Link>
        </div>

        {properties.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--secondary)',
          }}>
            <p style={{ marginBottom: '1rem' }}>
              No properties assigned yet.
            </p>
            {pendingAssignments.length > 0 ? (
              <Link
                href="/landlord/assignments"
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              >
                Review your pending assignments
              </Link>
            ) : (
              <p style={{ fontSize: '0.875rem' }}>
                Property assignments will appear here once a landlord assigns you to manage their properties.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {properties.slice(0, 5).map(property => (
              <Link
                key={property.id}
                href={`/landlord/properties/${property.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>
                    {property.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                    {property.address}, {property.city}, {property.state}
                  </div>
                </div>
                <div style={{
                  backgroundColor: 'var(--border)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--secondary)',
                }}>
                  {property.unitCount} unit{property.unitCount !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
            {properties.length > 5 && (
              <Link
                href="/landlord/properties"
                style={{
                  textAlign: 'center',
                  padding: '0.75rem',
                  color: 'var(--accent)',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                View all {properties.length} properties
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <Link
          href="/landlord/maintenance"
          className="card"
          style={{
            padding: '1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Maintenance</div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            View and manage requests
          </div>
        </Link>

        <Link
          href="/manager/revenue"
          className="card"
          style={{
            padding: '1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Revenue</div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Track your earnings
          </div>
        </Link>

        <Link
          href="/landlord"
          className="card"
          style={{
            padding: '1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Full Dashboard</div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
            Access all features
          </div>
        </Link>
      </div>
    </div>
  );
}
