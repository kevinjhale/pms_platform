'use client';

interface MetricCardProps {
  value: string | number;
  label: string;
  color?: string;
  subtitle?: string;
}

export function MetricCard({ value, label, color, subtitle }: MetricCardProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: color || 'var(--foreground)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--secondary)',
          marginTop: '0.25rem',
        }}
      >
        {label}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--secondary)',
            marginTop: '0.25rem',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
