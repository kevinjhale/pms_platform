import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { getPropertiesByOrganization, getAvailableUnits } from '@/services/properties';

export default async function LandlordDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const properties = await getPropertiesByOrganization(organization.id);
  const availableUnits = await getAvailableUnits(organization.id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{organization.name}</p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{properties.length}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Properties</div>
        </div>
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{availableUnits.length}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Available Units</div>
        </div>
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Apps</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Properties */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Properties
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Manage your rental properties and units.
          </p>
          {properties.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No properties yet. Add your first property to get started.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
              {properties.slice(0, 3).map((prop) => (
                <li key={prop.id} style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                }}>
                  <Link href={`/landlord/properties/${prop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {prop.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/landlord/properties/new" className="btn btn-primary" style={{ flex: 1 }}>
              Add Property
            </Link>
            <Link href="/landlord/properties" className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
              View All
            </Link>
          </div>
        </div>

        {/* Listings */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Listings
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Publish units for rent and attract tenants.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>• High-res photos & 3D tours</li>
            <li style={{ marginBottom: '0.5rem' }}>• Syndicate to Zillow, Apartments.com</li>
            <li style={{ marginBottom: '0.5rem' }}>• Built-in inquiry management</li>
          </ul>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/landlord/listings/new" className="btn btn-primary" style={{ flex: 1 }}>
              Create Listing
            </Link>
            <Link href="/landlord/listings" className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
              Manage
            </Link>
          </div>
        </div>

        {/* Applications */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Applications
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Review tenant applications and documents.
          </p>
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending Review</div>
          </div>
          <Link href="/landlord/applications" className="btn" style={{ width: '100%', border: '1px solid var(--border-color)' }}>
            View Applications
          </Link>
        </div>

        {/* Screening */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Background Screening
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Credit & criminal checks via trusted partners.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>
              TransUnion
            </span>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px' }}>
              Experian
            </span>
          </div>
          <Link href="/landlord/screening" className="btn" style={{ width: '100%', border: '1px solid var(--border-color)' }}>
            Request Screening
          </Link>
        </div>

        {/* Leases */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Leases
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Manage lease agreements and rent collection.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>• Active lease tracking</li>
            <li style={{ marginBottom: '0.5rem' }}>• Rent due dates & reminders</li>
            <li style={{ marginBottom: '0.5rem' }}>• Payment history</li>
          </ul>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/landlord/leases/new" className="btn btn-primary" style={{ flex: 1 }}>
              New Lease
            </Link>
            <Link href="/landlord/leases" className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
              View All
            </Link>
          </div>
        </div>

        {/* Maintenance */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Maintenance
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Track and manage maintenance requests from tenants.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>• Request prioritization</li>
            <li style={{ marginBottom: '0.5rem' }}>• Status tracking & comments</li>
            <li style={{ marginBottom: '0.5rem' }}>• Cost tracking</li>
          </ul>
          <Link href="/landlord/maintenance" className="btn" style={{ width: '100%', border: '1px solid var(--border-color)' }}>
            View Requests
          </Link>
        </div>

        {/* Activity Log */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Activity Log
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Audit trail for compliance and accountability.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>• Track all user actions</li>
            <li style={{ marginBottom: '0.5rem' }}>• Filter by entity type</li>
            <li style={{ marginBottom: '0.5rem' }}>• Compliance ready</li>
          </ul>
          <Link href="/landlord/activity" className="btn" style={{ width: '100%', border: '1px solid var(--border-color)' }}>
            View Activity
          </Link>
        </div>

        {/* Reports */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Reports & Analytics
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Key metrics and insights for your portfolio.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>• Occupancy rates</li>
            <li style={{ marginBottom: '0.5rem' }}>• Revenue tracking</li>
            <li style={{ marginBottom: '0.5rem' }}>• Lease expirations</li>
          </ul>
          <Link href="/landlord/reports" className="btn btn-primary" style={{ width: '100%' }}>
            View Reports
          </Link>
        </div>
      </div>
    </main>
  );
}
