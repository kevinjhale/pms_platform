import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Simple top navigation for PM */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}>
        <Link href="/manager" style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--primary)',
          textDecoration: 'none',
        }}>
          PM Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/manager" style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            color: 'var(--foreground)',
            fontSize: '0.875rem',
          }}>
            Overview
          </Link>
          <Link href="/manager/revenue" style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            color: 'var(--foreground)',
            fontSize: '0.875rem',
          }}>
            Revenue
          </Link>
          <Link href="/landlord" style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            color: 'var(--secondary)',
            fontSize: '0.875rem',
          }}>
            Full Dashboard
          </Link>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--secondary)' }}>
          {session.user.name || session.user.email}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
