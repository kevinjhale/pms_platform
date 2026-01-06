import { auth } from '@/lib/auth';
import { getDb } from '@/db';

const db = getDb();
import { users, organizationMembers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function MaintenanceSettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let user = null;
  let org = null;

  if (userId) {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    user = userResult[0] || null;

    const memberResult = await db
      .select({
        orgId: organizationMembers.organizationId,
        role: organizationMembers.role,
        orgName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (memberResult[0]) {
      org = memberResult[0];
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Settings</h1>
      <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
        Manage your account settings and preferences.
      </p>

      {/* Profile Information */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Profile Information</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Name
            </div>
            <div style={{ fontWeight: 500 }}>{user?.name || 'Not set'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Email
            </div>
            <div style={{ fontWeight: 500 }}>{user?.email || 'Not set'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              User ID
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                backgroundColor: 'var(--surface)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                display: 'inline-block',
              }}
            >
              {userId || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Role
            </div>
            <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>
              Maintenance Staff
            </div>
          </div>
        </div>
      </div>

      {/* Organization */}
      {org && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Organization</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Organization
              </div>
              <div style={{ fontWeight: 500 }}>{org.orgName}</div>
            </div>
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Org Role
              </div>
              <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{org.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Notification Preferences</h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
          Email notification settings coming soon.
        </p>
      </div>

      {/* Security */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Security</h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Your account is secured through OAuth authentication.
        </p>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="btn btn-secondary">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
