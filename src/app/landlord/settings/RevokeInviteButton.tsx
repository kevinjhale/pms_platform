'use client';

import { useState } from 'react';
import { revokeInviteAction } from '@/app/actions/invites';

export default function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleRevoke() {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return;
    }

    setIsPending(true);
    await revokeInviteAction(inviteId);
    setIsPending(false);
  }

  return (
    <button
      onClick={handleRevoke}
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
      {isPending ? 'Revoking...' : 'Revoke'}
    </button>
  );
}
