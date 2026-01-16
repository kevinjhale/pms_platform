'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeMemberAction } from '@/app/actions/organizations';

interface RemoveMemberButtonProps {
  userId: string;
  memberName: string;
}

export default function RemoveMemberButton({ userId, memberName }: RemoveMemberButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm(`Remove ${memberName} from the organization? They will lose access to all organization resources.`)) {
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await removeMemberAction(userId);

    setIsPending(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to remove member');
      alert(result.error || 'Failed to remove member');
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      style={{
        padding: '0.375rem 0.75rem',
        fontSize: '0.75rem',
        color: '#dc2626',
        backgroundColor: 'transparent',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  );
}
