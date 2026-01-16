'use client';

import { useEffect, useCallback, useState } from 'react';
import { assignPropertyManagerAction } from '@/app/actions/pmAssignments';

interface OrgMember {
  member: {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface AssignManagerModalProps {
  propertyId: string;
  members: OrgMember[];
  onClose: () => void;
}

export function AssignManagerModal({
  propertyId,
  members,
  onClose,
}: AssignManagerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await assignPropertyManagerAction(propertyId, formData);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to assign manager');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          maxWidth: '450px',
          width: '90%',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Assign Property Manager
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--secondary)',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {members.length === 0 ? (
          <p style={{ color: 'var(--secondary)' }}>
            No eligible members to assign. All organization members are already
            assigned to this property.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="userId"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                Select Manager
              </label>
              <select
                id="userId"
                name="userId"
                required
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--background)',
                }}
              >
                <option value="">-- Select a member --</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name || m.user.email} ({m.member.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="splitPercentage"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                Split Percentage
              </label>
              <input
                type="number"
                id="splitPercentage"
                name="splitPercentage"
                required
                min="0"
                max="100"
                defaultValue="10"
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--background)',
                }}
              />
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--secondary)',
                  marginTop: '0.25rem',
                }}
              >
                The percentage of rent the property manager will receive (0-100)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Assigning...' : 'Assign Manager'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
