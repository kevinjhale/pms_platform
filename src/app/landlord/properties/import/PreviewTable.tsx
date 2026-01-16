'use client';

import { useState } from 'react';
import { type ParsedRow, type ValidationError, getErrorsForRow } from '@/lib/csvValidation';

interface PreviewTableProps {
  rows: ParsedRow[];
  errors: ValidationError[];
}

export default function PreviewTable({ rows, errors }: PreviewTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const rowsWithErrors = new Set(errors.filter(e => e.severity === 'error').map(e => e.row));
  const rowsWithWarnings = new Set(errors.filter(e => e.severity === 'warning').map(e => e.row));

  return (
    <div>
      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 500 }}>{rows.length}</span>{' '}
          <span style={{ color: 'var(--secondary)' }}>total rows</span>
        </div>
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: errorCount > 0 ? '#fef2f2' : '#f0fdf4',
            borderRadius: 'var(--radius)',
            border: `1px solid ${errorCount > 0 ? '#fecaca' : '#bbf7d0'}`,
            color: errorCount > 0 ? '#dc2626' : '#16a34a',
          }}
        >
          <span style={{ fontWeight: 500 }}>{rows.length - rowsWithErrors.size}</span> valid
          {errorCount > 0 && (
            <>
              {' / '}
              <span style={{ fontWeight: 500 }}>{rowsWithErrors.size}</span> with errors
            </>
          )}
        </div>
        {warningCount > 0 && (
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fffbeb',
              borderRadius: 'var(--radius)',
              border: '1px solid #fed7aa',
              color: '#d97706',
            }}
          >
            <span style={{ fontWeight: 500 }}>{warningCount}</span> warnings
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: 'var(--surface)' }}>
              <th style={thStyle}>Row</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Property</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>City</th>
              <th style={thStyle}>State</th>
              <th style={thStyle}>ZIP</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Bed</th>
              <th style={thStyle}>Bath</th>
              <th style={thStyle}>Sqft</th>
              <th style={thStyle}>Rent</th>
              <th style={thStyle}>Deposit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowErrors = getErrorsForRow(errors, row.rowNumber);
              const hasError = rowErrors.some(e => e.severity === 'error');
              const hasWarning = rowErrors.some(e => e.severity === 'warning');
              const isExpanded = expandedRow === row.rowNumber;

              return (
                <tr
                  key={row.rowNumber}
                  onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                  style={{
                    backgroundColor: hasError ? '#fef2f2' : hasWarning ? '#fffbeb' : 'transparent',
                    cursor: rowErrors.length > 0 ? 'pointer' : 'default',
                  }}
                >
                  <td style={tdStyle}>{row.rowNumber}</td>
                  <td style={tdStyle}>
                    {hasError ? (
                      <span style={{ color: '#dc2626' }} title="Has errors">
                        Error
                      </span>
                    ) : hasWarning ? (
                      <span style={{ color: '#d97706' }} title="Has warnings">
                        Warn
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a' }} title="Valid">
                        OK
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>{row.property_name}</td>
                  <td style={tdStyle}>{row.property_type}</td>
                  <td style={tdStyle}>{row.address}</td>
                  <td style={tdStyle}>{row.city}</td>
                  <td style={tdStyle}>{row.state}</td>
                  <td style={tdStyle}>{row.zip}</td>
                  <td style={tdStyle}>{row.unit_number || '-'}</td>
                  <td style={tdStyle}>{row.bedrooms}</td>
                  <td style={tdStyle}>{row.bathrooms}</td>
                  <td style={tdStyle}>{row.sqft || '-'}</td>
                  <td style={tdStyle}>${row.rent_amount}</td>
                  <td style={tdStyle}>{row.deposit_amount ? `$${row.deposit_amount}` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded error details */}
      {expandedRow !== null && (
        <ErrorDetails
          rowNumber={expandedRow}
          errors={getErrorsForRow(errors, expandedRow)}
          onClose={() => setExpandedRow(null)}
        />
      )}
    </div>
  );
}

function ErrorDetails({
  rowNumber,
  errors,
  onClose,
}: {
  rowNumber: number;
  errors: ValidationError[];
  onClose: () => void;
}) {
  if (errors.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <strong>Row {rowNumber} Issues</strong>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: 'var(--secondary)',
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {errors.map((error, i) => (
          <li
            key={i}
            style={{
              color: error.severity === 'error' ? '#dc2626' : '#d97706',
              marginBottom: '0.25rem',
            }}
          >
            <strong>{error.column}</strong>: {error.message}
            {error.value && (
              <span style={{ color: 'var(--secondary)' }}> (value: "{error.value}")</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};
