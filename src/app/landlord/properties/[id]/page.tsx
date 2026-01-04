import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getPropertyById, getUnitsByProperty } from '@/services/properties';
import { createUnitAction, deletePropertyAction } from '@/app/actions/properties';
import { formatCurrency, centsToDollars } from '@/lib/utils';
import Link from 'next/link';

const STATUS_COLORS = {
  available: { bg: '#dcfce7', text: '#166534' },
  occupied: { bg: '#dbeafe', text: '#1e40af' },
  maintenance: { bg: '#fef3c7', text: '#92400e' },
  unlisted: { bg: '#f3f4f6', text: '#4b5563' },
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const units = await getUnitsByProperty(id);

  const createUnitWithPropertyId = createUnitAction.bind(null, id);
  const deletePropertyWithId = deletePropertyAction.bind(null, id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <Link
        href="/landlord/properties"
        style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Back to Properties
      </Link>

      {/* Property Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{property.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '999px',
              fontSize: '0.875rem',
            }}>
              {property.propertyType.replace('_', ' ')}
            </span>
            {property.yearBuilt && (
              <span style={{
                marginLeft: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}>
                Built {property.yearBuilt}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href={`/landlord/properties/${id}/edit`}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            Edit Property
          </Link>
          <form action={deletePropertyWithId}>
            <button
              type="submit"
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this property? This will also delete all units.')) {
                  e.preventDefault();
                }
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {property.description && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Description</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{property.description}</p>
        </div>
      )}

      {/* Units Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <h2>Units ({units.length})</h2>
      </div>

      {/* Add Unit Form */}
      <details style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
      }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          + Add New Unit
        </summary>
        <form action={createUnitWithPropertyId} style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Unit Number
              </label>
              <input
                type="text"
                name="unitNumber"
                placeholder="e.g., 101"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Bedrooms *
              </label>
              <input
                type="number"
                name="bedrooms"
                required
                min="0"
                placeholder="2"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Bathrooms *
              </label>
              <input
                type="number"
                name="bathrooms"
                required
                min="0"
                step="0.5"
                placeholder="1.5"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Sq Ft
              </label>
              <input
                type="number"
                name="sqft"
                min="0"
                placeholder="850"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Rent ($/mo) *
              </label>
              <input
                type="number"
                name="rentAmount"
                required
                min="0"
                step="0.01"
                placeholder="1500"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Deposit ($)
              </label>
              <input
                type="number"
                name="depositAmount"
                min="0"
                step="0.01"
                placeholder="1500"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Status
              </label>
              <select
                name="status"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <option value="unlisted">Unlisted</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              Features (comma-separated)
            </label>
            <input
              type="text"
              name="features"
              placeholder="e.g., Dishwasher, In-unit laundry, Balcony"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.625rem 1.5rem',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Add Unit
          </button>
        </form>
      </details>

      {/* Units List */}
      {units.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'var(--bg-primary)',
          border: '1px dashed var(--border-color)',
          borderRadius: '12px',
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            No units yet. Add your first unit above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {units.map((unit) => {
            const statusStyle = STATUS_COLORS[unit.status];
            return (
              <div
                key={unit.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>
                      {unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {unit.bedrooms} bed · {unit.bathrooms} bath
                      {unit.sqft && ` · ${unit.sqft.toLocaleString()} sqft`}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}>
                    {unit.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                      {formatCurrency(unit.rentAmount)}
                      <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span>
                    </div>
                    {unit.depositAmount && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(unit.depositAmount)} deposit
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/landlord/properties/${id}/units/${unit.id}/edit`}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
