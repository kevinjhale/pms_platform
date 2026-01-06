import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getMaintenanceRequestById, getMaintenanceComments } from '@/services/maintenance';
import { updateStatusAction, addCommentAction, completeTicketAction } from './actions';

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

export default async function MaintenanceTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const request = await getMaintenanceRequestById(id);

  if (!request) {
    notFound();
  }

  const comments = await getMaintenanceComments(id, true);
  const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.open;
  const priorityColor = PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.medium;

  const updateStatusWithId = updateStatusAction.bind(null, id);
  const addCommentWithId = addCommentAction.bind(null, id);
  const completeWithId = completeTicketAction.bind(null, id);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <Link
        href="/maintenance"
        style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
      >
        &larr; Back to Tickets
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: priorityColor.bg,
                color: priorityColor.text,
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}>
                {request.priority} priority
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
            <h1 style={{ marginBottom: '0.5rem' }}>{request.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {request.propertyName} {request.unitNumber && `- Unit ${request.unitNumber}`}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {request.propertyAddress}
            </p>
          </div>

          {/* Description */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            marginBottom: '2rem',
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{request.description}</p>
          </div>

          {/* Resolution (if completed) */}
          {request.status === 'completed' && request.resolutionSummary && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#dcfce7',
              borderRadius: '12px',
              marginBottom: '2rem',
            }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#166534' }}>Resolution</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{request.resolutionSummary}</p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                {request.hoursSpent != null && (
                  <p style={{ fontWeight: 500 }}>
                    Hours: {request.hoursSpent}
                  </p>
                )}
                {request.actualCost != null && (
                  <p style={{ fontWeight: 500 }}>
                    Cost: ${(request.actualCost / 100).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comments / Activity */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Activity ({comments.length})</h3>

            {/* Add Comment Form */}
            <form action={addCommentWithId} style={{ marginBottom: '1.5rem' }}>
              <textarea
                name="content"
                required
                placeholder="Add a note..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical',
                  marginBottom: '0.5rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input type="checkbox" name="isInternal" value="true" />
                  Internal note (not visible to tenant)
                </label>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Add Note
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: comment.isInternal ? '#fef3c7' : 'var(--bg-secondary)',
                    borderRadius: '8px',
                    borderLeft: comment.isInternal ? '3px solid #f59e0b' : 'none',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}>
                    <span style={{ fontWeight: 500 }}>
                      {comment.authorName}
                      {comment.isInternal && (
                        <span style={{ color: '#92400e', marginLeft: '0.5rem' }}>(Internal)</span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Details */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            marginBottom: '1rem',
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Details</h3>
            <dl style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <dt style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Category</dt>
                <dd style={{ textTransform: 'capitalize' }}>{request.category}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Requested By</dt>
                <dd>{request.requestedByName}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Created</dt>
                <dd>{new Date(request.createdAt).toLocaleString()}</dd>
              </div>
              {request.assignedToName && (
                <div>
                  <dt style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Assigned To</dt>
                  <dd>{request.assignedToName}</dd>
                </div>
              )}
              {request.permissionToEnter && (
                <div>
                  <dt style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Entry Permission</dt>
                  <dd style={{ color: '#166534' }}>Yes, tenant has granted entry</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          {request.status !== 'completed' && request.status !== 'cancelled' && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Actions</h3>

              {/* Update Status */}
              <form action={updateStatusWithId} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Update Status
                </label>
                <select
                  name="status"
                  defaultValue={request.status}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                  }}
                >
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_parts">Pending Parts</option>
                </select>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Update Status
                </button>
              </form>

              {/* Complete Ticket */}
              <form action={completeWithId}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Mark Complete
                </label>
                <textarea
                  name="resolutionSummary"
                  required
                  placeholder="Describe the work done..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    minHeight: '80px',
                    resize: 'vertical',
                    marginBottom: '0.5rem',
                  }}
                />
                <input
                  type="number"
                  name="hoursSpent"
                  placeholder="Hours spent"
                  step="0.25"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                  }}
                />
                <input
                  type="number"
                  name="actualCost"
                  placeholder="Actual cost ($)"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#166534',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Complete Ticket
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
