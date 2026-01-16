'use client';

import type { ImportResult } from '@/lib/csvValidation';

interface ImportProgressProps {
  current: number;
  total: number;
  result: ImportResult | null;
}

export default function ImportProgress({ current, total, result }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = result !== null;

  return (
    <div>
      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--surface)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: isComplete
              ? result.propertiesFailed > 0
                ? '#f59e0b'
                : '#22c55e'
              : 'var(--accent)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status text */}
      {!isComplete && (
        <p style={{ textAlign: 'center', color: 'var(--secondary)' }}>
          Importing property {current} of {total}... ({percentage}%)
        </p>
      )}

      {/* Result summary */}
      {isComplete && (
        <div>
          {result.propertiesFailed === 0 ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#16a34a',
                marginBottom: '1rem',
              }}
            >
              <p style={{ margin: 0, fontWeight: 500 }}>Import Complete</p>
              <p style={{ margin: '0.5rem 0 0' }}>
                Successfully imported {result.propertiesCreated} properties with {result.unitsCreated} units.
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                color: '#d97706',
                marginBottom: '1rem',
              }}
            >
              <p style={{ margin: 0, fontWeight: 500 }}>Import Completed with Errors</p>
              <p style={{ margin: '0.5rem 0 0' }}>
                Imported {result.propertiesCreated} properties with {result.unitsCreated} units.
                <br />
                {result.propertiesFailed} properties failed to import.
              </p>
            </div>
          )}

          {/* Error details */}
          {result.errors.length > 0 && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Failed Properties:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {result.errors.map((err, i) => (
                  <li key={i}>
                    <strong>{err.propertyName}</strong>: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <StatCard
              label="Properties"
              value={result.propertiesCreated}
              color="#16a34a"
            />
            <StatCard
              label="Units"
              value={result.unitsCreated}
              color="#2563eb"
            />
            {result.propertiesFailed > 0 && (
              <StatCard
                label="Failed"
                value={result.propertiesFailed}
                color="#dc2626"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color }}>{value}</p>
      <p style={{ margin: '0.25rem 0 0', color: 'var(--secondary)', fontSize: '0.875rem' }}>
        {label}
      </p>
    </div>
  );
}
