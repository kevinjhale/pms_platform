'use client';

import { useState, useTransition } from 'react';
import { updateDefaultPageAction } from '@/app/actions/users';

const PAGE_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'properties', label: 'Properties' },
  { value: 'listings', label: 'Listings' },
  { value: 'applications', label: 'Applications' },
  { value: 'leases', label: 'Leases' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reports', label: 'Reports & Analytics' },
  { value: 'activity', label: 'Activity Log' },
  { value: 'screening', label: 'Tenant Screening' },
  { value: 'settings', label: 'Settings' },
] as const;

interface DefaultPageSelectProps {
  currentPage: string;
}

export default function DefaultPageSelect({ currentPage }: DefaultPageSelectProps) {
  const [selectedPage, setSelectedPage] = useState(currentPage);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPage = e.target.value;
    setSelectedPage(newPage);
    setMessage(null);

    startTransition(async () => {
      const result = await updateDefaultPageAction(newPage);
      if (result.success) {
        setMessage({ type: 'success', text: 'Default page updated' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update' });
        setSelectedPage(currentPage);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <select
          value={selectedPage}
          onChange={handleChange}
          disabled={isPending}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            fontSize: '0.875rem',
            minWidth: '200px',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
          aria-label="Select default landing page"
        >
          {PAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isPending && (
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
            Saving...
          </span>
        )}
      </div>
      {message && (
        <span
          style={{
            fontSize: '0.75rem',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
          }}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
