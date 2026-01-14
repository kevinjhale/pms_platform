'use client';

import Link from 'next/link';

const QUICK_ACTIONS = [
  { label: 'Add Property', href: '/landlord/properties/new', icon: '🏠' },
  { label: 'New Maintenance', href: '/landlord/maintenance/new', icon: '🔧' },
  { label: 'View Applications', href: '/landlord/applications', icon: '📋' },
  { label: 'View Reports', href: '/landlord/reports', icon: '📊' },
];

export function QuickActionsCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface)';
            e.currentTarget.style.color = 'inherit';
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>{action.icon}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
