import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/services/users';
import { selectRoleAction } from '@/app/actions/users';

export default async function SelectRolePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user already has a role selected
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
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Select your role to get started.
        </p>

        <form action={selectRoleAction}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="role"
                value="renter"
                required
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Renter</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  I'm looking for a place to rent or I'm already renting.
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="role"
                value="landlord"
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Landlord</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  I own properties and manage them myself.
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="role"
                value="manager"
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Property Manager</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  I manage properties on behalf of landlords.
                </div>
              </div>
            </label>
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
        </form>
      </div>
    </div>
  );
}
