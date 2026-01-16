import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserById, getUserRoles } from '@/services/users';
import { selectRolesAction } from '@/app/actions/users';

const ROLE_OPTIONS = [
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'I own properties and manage them myself.',
    icon: '🏢',
  },
  {
    value: 'manager',
    label: 'Property Manager',
    description: 'I manage properties on behalf of landlords.',
    icon: '📋',
  },
  {
    value: 'renter',
    label: 'Renter',
    description: "I'm looking for a place to rent or I'm already renting.",
    icon: '🏠',
  },
  {
    value: 'maintenance',
    label: 'Maintenance Worker',
    description: 'I handle maintenance and repair work.',
    icon: '🔧',
  },
];

export default async function SelectRolePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user already has roles selected
  const userRoles = await getUserRoles(session.user.id);
  if (userRoles.length > 0) {
    redirect('/dashboard');
  }

  // Also check legacy single role
  const user = await getUserById(session.user.id);
  if (user?.role) {
    redirect('/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>
          Welcome to PMS Platform
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Select your role(s) to get started.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          You can select multiple roles if they apply to you.
        </p>

        <form action={selectRolesAction}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={role.value}
                  style={{
                    marginTop: '0.25rem',
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--accent-color)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {role.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continue
          </button>

          <p style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}>
            You can change your roles later in settings.
          </p>
        </form>
      </div>
    </div>
  );
}
