import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { getPropertiesByOrganization } from '@/services/properties';
import Link from 'next/link';

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const properties = await getPropertiesByOrganization(organization.id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Properties</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your rental properties and units
          </p>
        </div>
        <Link
          href="/landlord/properties/new"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
        }}>
          <h2 style={{ marginBottom: '0.5rem' }}>No properties yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Add your first property to start managing rentals.
          </p>
          <Link
            href="/landlord/properties/new"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/landlord/properties/${property.id}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>{property.name}</h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {property.address}<br />
                {property.city}, {property.state} {property.zip}
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.875rem',
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '999px',
                }}>
                  {property.propertyType.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
