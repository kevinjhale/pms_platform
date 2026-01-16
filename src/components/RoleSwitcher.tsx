'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { switchRoleAction } from '@/app/actions/users';

type PlatformRole = 'renter' | 'landlord' | 'manager' | 'maintenance';

const ROLE_LABELS: Record<PlatformRole, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  manager: 'Property Manager',
  maintenance: 'Maintenance',
};

const ROLE_ICONS: Record<PlatformRole, string> = {
  renter: '🏠',
  landlord: '🏢',
  manager: '📋',
  maintenance: '🔧',
};

interface RoleSwitcherProps {
  activeRole: PlatformRole;
  availableRoles: PlatformRole[];
}

export default function RoleSwitcher({ activeRole, availableRoles }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Only show if user has multiple roles
  if (availableRoles.length < 2) {
    return null;
  }

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

  async function handleRoleSwitch(role: PlatformRole) {
    if (role === activeRole) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const result = await switchRoleAction(role);
    setIsLoading(false);

    if (result.success && result.redirectTo) {
      setIsOpen(false);
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--primary)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current role: ${ROLE_LABELS[activeRole]}. Click to switch roles.`}
      >
        <span>{ROLE_ICONS[activeRole]}</span>
        <span>{ROLE_LABELS[activeRole]}</span>
        <span style={{ marginLeft: '0.25rem', fontSize: '0.625rem' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select role"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            minWidth: '180px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '0.25rem' }}>
            {availableRoles.map((role) => (
              <button
                key={role}
                role="option"
                aria-selected={role === activeRole}
                onClick={() => handleRoleSwitch(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  color: role === activeRole ? 'var(--primary)' : 'var(--foreground)',
                  backgroundColor: role === activeRole ? 'var(--accent-bg)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (role !== activeRole) {
                    e.currentTarget.style.backgroundColor = 'var(--border)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = role === activeRole ? 'var(--accent-bg)' : 'transparent';
                }}
              >
                <span>{ROLE_ICONS[role]}</span>
                <span>{ROLE_LABELS[role]}</span>
                {role === activeRole && (
                  <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
