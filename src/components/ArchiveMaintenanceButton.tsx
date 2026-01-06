'use client';

import { useTransition } from 'react';

interface ArchiveMaintenanceButtonProps {
  isArchived: boolean;
  onArchive: () => Promise<void>;
  onUnarchive: () => Promise<void>;
}

export function ArchiveMaintenanceButton({
  isArchived,
  onArchive,
  onUnarchive,
}: ArchiveMaintenanceButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const action = isArchived ? onUnarchive : onArchive;
    const confirmMessage = isArchived
      ? 'Are you sure you want to unarchive this request?'
      : 'Are you sure you want to archive this request?';

    if (confirm(confirmMessage)) {
      startTransition(async () => {
        await action();
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: isArchived ? '#f0fdf4' : '#f1f5f9',
        color: isArchived ? '#15803d' : '#64748b',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {isPending
        ? isArchived
          ? 'Unarchiving...'
          : 'Archiving...'
        : isArchived
        ? 'Unarchive Request'
        : 'Archive Request'}
    </button>
  );
}
