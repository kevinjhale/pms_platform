'use client';

import { useTransition } from 'react';

interface ArchiveAllCompletedButtonProps {
  onArchiveAll: () => Promise<{ count: number }>;
}

export function ArchiveAllCompletedButton({
  onArchiveAll,
}: ArchiveAllCompletedButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm('Archive all completed maintenance requests that have been completed for more than 7 days?')) {
      startTransition(async () => {
        const result = await onArchiveAll();
        if (result.count > 0) {
          alert(`Archived ${result.count} request${result.count === 1 ? '' : 's'}.`);
        } else {
          alert('No requests to archive.');
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn"
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        border: '1px solid var(--border)',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {isPending ? 'Archiving...' : 'Archive All Completed (7+ days)'}
    </button>
  );
}
