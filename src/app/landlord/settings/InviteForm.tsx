'use client';

import { useActionState } from 'react';
import { createInviteAction } from '@/app/actions/invites';

type FormState = {
  success: boolean;
  error?: string;
} | null;

async function handleSubmit(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await createInviteAction(formData);
  return result;
}

export default function InviteForm() {
  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  return (
    <form action={formAction}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '0.75rem',
          alignItems: 'end',
        }}
      >
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="colleague@example.com"
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div>
          <label
            htmlFor="role"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
            }}
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            style={{
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '120px',
            }}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
          style={{ padding: '0.625rem 1.25rem' }}
        >
          {isPending ? 'Sending...' : 'Send Invite'}
        </button>
      </div>

      {state?.error && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.875rem',
          }}
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#16a34a',
            fontSize: '0.875rem',
          }}
        >
          Invite sent successfully!
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <strong>Role descriptions:</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
          <li><strong>Staff</strong> - View properties, manage maintenance requests</li>
          <li><strong>Manager</strong> - All staff permissions, plus manage tenants and leases</li>
          <li><strong>Admin</strong> - Full access, can invite other members</li>
        </ul>
      </div>
    </form>
  );
}
