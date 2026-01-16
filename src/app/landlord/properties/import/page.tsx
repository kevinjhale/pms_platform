import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { getPmClients } from '@/services/pmClients';
import Link from 'next/link';
import ImportWizard from './ImportWizard';

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function ImportPropertiesPage({ searchParams }: PageProps) {
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

  // Determine landlord ID based on context
  let landlordId: string | undefined;
  if (isPlatformManager && clientId) {
    const client = pmClients.find(c => c.id === clientId);
    landlordId = client?.landlordUserId ?? undefined;
  } else if (!isPlatformManager) {
    landlordId = session.user.id;
  }

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/landlord/properties"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← Back to Properties
        </Link>
      </div>

      <h1 style={{ marginBottom: '0.5rem' }}>Import Properties from CSV</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        Bulk import properties and units from a CSV file.
      </p>

      {/* Client selector for property managers */}
      {isPlatformManager && hasPmClients && !clientId && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Select Client</h3>
          <p style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Choose which client to import properties for:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {pmClients.filter(c => c.canCreateProperties).map((client) => (
              <Link
                key={client.id}
                href={`/landlord/properties/import?client=${client.id}`}
                className="btn"
                style={{ textDecoration: 'none' }}
              >
                {client.displayName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Show selected client */}
      {isPlatformManager && clientId && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Importing for: </span>
            <strong>{pmClients.find(c => c.id === clientId)?.displayName}</strong>
          </div>
          <Link
            href="/landlord/properties/import"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Change
          </Link>
        </div>
      )}

      {/* Show import wizard if we have required context */}
      {(!isPlatformManager || clientId) && (
        <ImportWizard
          organizationId={organization.id}
          landlordId={landlordId}
          clientId={clientId}
        />
      )}
    </main>
  );
}
