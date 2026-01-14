'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PmClient } from '@/services/pmClients';

interface ClientSelectorProps {
  clients: PmClient[];
  currentClientId: string | null;
}

export function ClientSelector({ clients, currentClientId }: ClientSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (clientId) {
      params.set('client', clientId);
    } else {
      params.delete('client');
    }

    router.push(`?${params.toString()}`);
  };

  // Calculate total properties across all clients
  const totalProperties = clients.reduce((sum, c) => sum + c.propertyCount, 0);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--surface)',
      borderRadius: '8px',
      marginBottom: '1.5rem',
    }}>
      <label
        htmlFor="client-selector"
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        Viewing properties for:
      </label>
      <select
        id="client-selector"
        value={currentClientId || ''}
        onChange={handleChange}
        style={{
          flex: 1,
          maxWidth: '400px',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          backgroundColor: 'var(--background)',
          fontSize: '0.875rem',
        }}
      >
        <option value="">All Clients ({totalProperties} properties)</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.displayName}
            {client.organizationName && ` (${client.organizationName})`}
            {` - ${client.propertyCount} properties`}
          </option>
        ))}
      </select>
      {currentClientId && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('client');
            router.push(`?${params.toString()}`);
          }}
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
