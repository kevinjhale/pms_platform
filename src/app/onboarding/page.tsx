import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { createOrganizationAction } from '@/app/actions/organizations';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organizations } = await getOrgContext();

  // If user already has orgs, redirect to dashboard
  if (organizations.length > 0) {
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
          Let's set up your organization to get started.
        </p>

        <form action={createOrganizationAction}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="e.g., Smith Properties LLC"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.5rem',
            }}>
              This is your company or business name.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              What type of user are you?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You'll be set up as the owner of this organization. You can invite
              landlords, property managers, or staff members later.
            </p>
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
            Create Organization
          </button>
        </form>
      </div>
    </div>
  );
}
