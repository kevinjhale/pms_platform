import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@/lib/org-context';
import { getPendingAssignmentsForManager } from '@/services/properties';
import AssignmentCard from './AssignmentCard';

export default async function AssignmentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  const pendingAssignments = await getPendingAssignmentsForManager(session.user.id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Property Assignments</h1>
        <p style={{ color: 'var(--secondary)' }}>
          Review and respond to property management assignments
        </p>
      </div>

      {pendingAssignments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{ marginBottom: '0.5rem' }}>No pending assignments</h2>
          <p style={{ color: 'var(--secondary)' }}>
            You don&apos;t have any property assignments waiting for your review.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {pendingAssignments.map(({ assignment, property }) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              property={property}
            />
          ))}
        </div>
      )}
    </main>
  );
}
