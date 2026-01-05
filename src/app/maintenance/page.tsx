import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMaintenanceRequestsByWorker, getAllMaintenanceRequests } from '@/services/maintenance';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#fef3c7', text: '#92400e' },
  acknowledged: { bg: '#dbeafe', text: '#1e40af' },
  in_progress: { bg: '#e0e7ff', text: '#3730a3' },
  pending_parts: { bg: '#fce7f3', text: '#9d174d' },
  completed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#f3f4f6', text: '#4b5563' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '#f3f4f6', text: '#4b5563' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#fed7aa', text: '#c2410c' },
  emergency: { bg: '#fecaca', text: '#dc2626' },
};

export default async function MaintenanceDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const view = params.view || 'my'; // 'my' or 'all'

  // Get maintenance requests
  const requests = view === 'all'
    ? await getAllMaintenanceRequests(statusFilter)
    : await getMaintenanceRequestsByWorker(session.user.id, statusFilter);

  // Calculate stats
  const stats = {
    assigned: requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Maintenance Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        View and manage your assigned maintenance tickets.
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.assigned}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Assigned to You</div>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#e0e7ff',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3730a3' }}>{stats.inProgress}</div>
          <div style={{ color: '#3730a3', fontSize: '0.875rem' }}>In Progress</div>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dcfce7',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#166534' }}>{stats.completed}</div>
          <div style={{ color: '#166534', fontSize: '0.875rem' }}>Completed</div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        <Link
          href="/maintenance?view=my"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: view === 'my' ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: view === 'my' ? 'white' : 'var(--text-primary)',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          My Tickets
        </Link>
        <Link
          href="/maintenance?view=all"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: view === 'all' ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: view === 'all' ? 'white' : 'var(--text-primary)',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          All Tickets
        </Link>
      </div>

      {/* Status Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '2rem',
      }}>
        <Link
          href={`/maintenance?view=${view}`}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: !statusFilter ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: !statusFilter ? 'white' : 'var(--text-primary)',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          All
        </Link>
        {['open', 'in_progress', 'pending_parts', 'completed'].map(status => (
          <Link
            key={status}
            href={`/maintenance?view=${view}&status=${status}`}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: statusFilter === status ? 'var(--accent-color)' : 'var(--bg-secondary)',
              color: statusFilter === status ? 'white' : 'var(--text-primary)',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              textTransform: 'capitalize',
            }}
          >
            {status.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {/* Tickets List */}
      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>No tickets found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {view === 'my' ? 'You have no assigned maintenance tickets.' : 'No maintenance tickets match your filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(request => {
            const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.open;
            const priorityColor = PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.medium;

            return (
              <Link
                key={request.id}
                href={`/maintenance/${request.id}`}
                style={{
                  display: 'block',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{request.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {request.propertyName} {request.unitNumber && `- Unit ${request.unitNumber}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: priorityColor.bg,
                      color: priorityColor.text,
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}>
                      {request.priority}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}>
                  <span>Category: {request.category}</span>
                  <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
