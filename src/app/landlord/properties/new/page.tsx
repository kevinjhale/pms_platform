import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { createPropertyAction } from '@/app/actions/properties';
import { getPmClients } from '@/services/pmClients';
import Link from 'next/link';

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'other', label: 'Other' },
];

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function NewPropertyPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const { client: clientId } = await searchParams;
  const isPlatformManager = session.user.role === 'manager';

  // Get PM clients if user is a property manager
  const pmClients = isPlatformManager
    ? await getPmClients(session.user.id)
    : [];

  const hasPmClients = pmClients.length > 0;

  // PMs must select a client to create a property for
  const selectedClient = clientId
    ? pmClients.find(c => c.id === clientId)
    : null;

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Add New Property</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Enter the details for your rental property.
      </p>

      <form action={createPropertyAction}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Client selector for property managers */}
          {isPlatformManager && hasPmClients && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}>
              <label htmlFor="clientId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Creating property for *
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                defaultValue={clientId || ''}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'var(--background)',
                }}
              >
                <option value="">Select a client...</option>
                {pmClients.filter(c => c.canCreateProperties).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                    {client.organizationName && ` (${client.organizationName})`}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                  This property will be added to {selectedClient.displayName}&apos;s portfolio.
                </p>
              )}
            </div>
          )}

          {/* Property Name */}
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Property Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g., Sunset Apartments"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* Property Type */}
          <div>
            <label htmlFor="propertyType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Property Type *
            </label>
            <select
              id="propertyType"
              name="propertyType"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <option value="">Select type...</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Street Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              placeholder="123 Main Street"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* City, State, Zip */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                placeholder="City"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label htmlFor="state" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                State *
              </label>
              <input
                type="text"
                id="state"
                name="state"
                required
                maxLength={2}
                placeholder="CA"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label htmlFor="zip" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                ZIP *
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                required
                placeholder="90210"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          {/* Year Built */}
          <div>
            <label htmlFor="yearBuilt" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Year Built
            </label>
            <input
              type="number"
              id="yearBuilt"
              name="yearBuilt"
              min="1800"
              max={new Date().getFullYear()}
              placeholder="2020"
              style={{
                width: '200px',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe the property..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Property
            </button>
            <Link
              href={clientId ? `/landlord/properties?client=${clientId}` : '/landlord/properties'}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
