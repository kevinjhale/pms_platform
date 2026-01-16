'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberRoleAction } from '@/app/actions/organizations';

type OrgRole = 'owner' | 'admin' | 'manager' | 'staff';

const ROLE_OPTIONS: { value: 'admin' | 'manager' | 'staff'; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
];

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  owner: { bg: '#fef3c7', color: '#92400e' },
  admin: { bg: '#dbeafe', color: '#1d4ed8' },
  manager: { bg: '#d1fae5', color: '#047857' },
  staff: { bg: '#e5e7eb', color: '#374151' },
};

interface EditMemberButtonProps {
  userId: string;
  currentRole: OrgRole;
  callerRole: OrgRole;
}

export default function EditMemberButton({ userId, currentRole, callerRole }: EditMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine which roles the caller can assign
  const availableRoles = ROLE_OPTIONS.filter((role) => {
    // Only owners can promote to admin
    if (role.value === 'admin' && callerRole !== 'owner') {
      return false;
    }
    return true;
  });

  async function handleRoleChange(newRole: 'admin' | 'manager' | 'staff') {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await updateMemberRoleAction(userId, newRole);

    setIsPending(false);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || 'Failed to update role');
    }
  }

  const roleStyle = ROLE_STYLES[currentRole] || ROLE_STYLES.staff;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.125rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          backgroundColor: roleStyle.bg,
          color: roleStyle.color,
          border: 'none',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {currentRole}
        <span style={{ fontSize: '0.5rem' }}>▼</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            minWidth: '140px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {error && (
            <div style={{
              padding: '0.5rem',
              fontSize: '0.75rem',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid var(--border)',
            }}>
              {error}
            </div>
          )}
          <div style={{ padding: '0.25rem' }}>
            {availableRoles.map((role) => {
              const isCurrentRole = role.value === currentRole;
              const style = ROLE_STYLES[role.value];
              return (
                <button
                  key={role.value}
                  role="option"
                  aria-selected={isCurrentRole}
                  onClick={() => handleRoleChange(role.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--foreground)',
                    backgroundColor: isCurrentRole ? 'var(--surface)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentRole) {
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isCurrentRole ? 'var(--surface)' : 'transparent';
                  }}
                >
                  <span>{role.label}</span>
                  {isCurrentRole && <span style={{ color: 'var(--primary)' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
