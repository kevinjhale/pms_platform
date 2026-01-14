import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import {
  getUnitsByOrganization,
  getUnitsForManager,
  getAllUnitsForPm,
  getUnitsForPmByClient,
  type UnitWithProperty,
} from '@/services/properties';
import { getPmClients } from '@/services/pmClients';
import Link from 'next/link';
import { ClientSelector } from '@/components/ClientSelector';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getStatusBadgeStyle(status: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    available: { bg: '#dcfce7', color: '#166534' },
    occupied: { bg: '#dbeafe', color: '#1d4ed8' },
    maintenance: { bg: '#fef3c7', color: '#92400e' },
    unlisted: { bg: '#f3f4f6', color: '#6b7280' },
  };
  return styles[status] || styles.unlisted;
}

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization, role: orgRole } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const { client: clientId } = await searchParams;

  const isPlatformManager = session.user.role === 'manager';
  const isOrgStaff = orgRole === 'manager' || orgRole === 'staff';

  // Get PM clients if user is a property manager
  const pmClients = isPlatformManager
    ? await getPmClients(session.user.id)
    : [];

  const hasPmClients = pmClients.length > 0;

  // Determine which units to show
  let units: UnitWithProperty[];

  if (isPlatformManager && hasPmClients) {
    // PM with client relationships - use new client-based filtering
    if (clientId) {
      units = await getUnitsForPmByClient(session.user.id, clientId);
    } else {
      units = await getAllUnitsForPm(session.user.id);
    }
  } else if (isPlatformManager || isOrgStaff) {
    // Legacy: PM without client relationships or org staff
    units = await getUnitsForManager(session.user.id, organization.id);
  } else {
    // Landlord - see all units in their org
    units = await getUnitsByOrganization(organization.id);
  }

  // Managers with clients can create properties
  const canCreateProperty = !isPlatformManager || hasPmClients;

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>
            {isPlatformManager ? 'Managed Properties' : 'Properties & Units'}
          </h1>
          <p style={{ color: 'var(--secondary)' }}>
            {isPlatformManager
              ? 'Properties and units you manage for your clients'
              : 'Manage your rental properties and units'}
          </p>
        </div>
        {canCreateProperty && (
          <Link
            href={clientId ? `/landlord/properties/new?client=${clientId}` : '/landlord/properties/new'}
            className="btn btn-primary"
          >
            + Add Property
          </Link>
        )}
      </div>

      {/* Client selector for property managers */}
      {isPlatformManager && hasPmClients && (
        <ClientSelector
          clients={pmClients}
          currentClientId={clientId || null}
        />
      )}

      {units.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{ marginBottom: '0.5rem' }}>
            {clientId ? 'No properties for this client' : (isPlatformManager ? 'No managed properties' : 'No units yet')}
          </h2>
          <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            {isPlatformManager && !hasPmClients
              ? 'You have no client relationships set up yet. Contact your administrator.'
              : clientId
                ? 'This client has no properties yet. Add one to get started.'
                : 'Add your first property to start managing rentals.'}
          </p>
          {canCreateProperty && (
            <Link
              href={clientId ? `/landlord/properties/new?client=${clientId}` : '/landlord/properties/new'}
              className="btn btn-primary"
            >
              + Add Property
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--background)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>
                    Property
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>
                    Unit
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>
                    Bed/Bath
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>
                    Sq Ft
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    Rent
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                    Status
                  </th>
                  <th scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, index) => {
                  const statusStyle = getStatusBadgeStyle(unit.status);
                  return (
                    <tr
                      key={unit.id}
                      style={{
                        borderBottom: index < units.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Link
                          href={`/landlord/properties/${unit.propertyId}`}
                          style={{
                            color: 'var(--primary)',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          {unit.propertyName}
                        </Link>
                        <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                          {unit.propertyCity}, {unit.propertyState}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                        {unit.unitNumber || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {unit.bedrooms} bd / {unit.bathrooms % 1 === 0 ? unit.bathrooms : unit.bathrooms.toFixed(1)} ba
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {unit.sqft ? unit.sqft.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500 }}>
                        {formatCurrency(unit.rentAmount)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}>
                          {unit.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <Link
                          href={`/landlord/properties/${unit.propertyId}/units/${unit.id}/edit`}
                          className="btn"
                          aria-label={`Edit unit ${unit.unitNumber || 'unnamed'} at ${unit.propertyName}`}
                          style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
