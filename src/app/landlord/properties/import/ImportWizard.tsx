'use client';

import { useState, useCallback } from 'react';
import CSVUploader from './CSVUploader';
import PreviewTable from './PreviewTable';
import ImportProgress from './ImportProgress';
import {
  type ParsedRow,
  type ValidationError,
  type PropertyGroup,
  type ImportResult,
  validateRows,
  hasErrors,
  generateTemplate,
  groupByProperty,
} from '@/lib/csvValidation';

type Step = 'upload' | 'preview' | 'confirm' | 'importing' | 'complete';

interface ImportWizardProps {
  organizationId: string;
  landlordId?: string;
  clientId?: string;
}

export default function ImportWizard({ organizationId, landlordId, clientId }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [propertyGroups, setPropertyGroups] = useState<PropertyGroup[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleParsed = useCallback((parsedRows: ParsedRow[], errors: string[]) => {
    setRows(parsedRows);
    setParseErrors(errors);

    if (errors.length === 0 && parsedRows.length > 0) {
      const validationErrs = validateRows(parsedRows);
      setValidationErrors(validationErrs);
      setStep('preview');
    }
  }, []);

  const handleContinueToConfirm = useCallback(() => {
    const groups = groupByProperty(rows);
    setPropertyGroups(groups);
    setStep('confirm');
  }, [rows]);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setImportProgress({ current: 0, total: propertyGroups.length });

    try {
      const response = await fetch('/api/properties/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: propertyGroups,
          organizationId,
          landlordId,
          clientId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
      setStep('complete');
    } catch (error) {
      setImportResult({
        propertiesCreated: 0,
        unitsCreated: 0,
        propertiesFailed: propertyGroups.length,
        errors: [{ propertyName: 'All', error: error instanceof Error ? error.message : 'Unknown error' }],
      });
      setStep('complete');
    }
  }, [propertyGroups, organizationId, landlordId, clientId]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setRows([]);
    setParseErrors([]);
    setValidationErrors([]);
    setPropertyGroups([]);
    setImportResult(null);
  }, []);

  const downloadTemplate = useCallback((withExamples: boolean) => {
    const csv = generateTemplate(withExamples);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = withExamples ? 'property_import_example.csv' : 'property_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const canProceedToImport = !hasErrors(validationErrors);

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StepIndicator step={1} label="Upload" active={step === 'upload'} completed={step !== 'upload'} />
        <StepIndicator step={2} label="Preview" active={step === 'preview'} completed={['confirm', 'importing', 'complete'].includes(step)} />
        <StepIndicator step={3} label="Confirm" active={step === 'confirm'} completed={['importing', 'complete'].includes(step)} />
        <StepIndicator step={4} label="Import" active={step === 'importing' || step === 'complete'} completed={step === 'complete'} />
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => downloadTemplate(false)}
              className="btn"
              style={{ marginRight: '0.5rem' }}
            >
              Download Template
            </button>
            <button
              type="button"
              onClick={() => downloadTemplate(true)}
              className="btn"
            >
              Download Example CSV
            </button>
          </div>

          <CSVUploader onParsed={handleParsed} />

          {parseErrors.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '0.875rem',
              }}
            >
              <strong>Parse Errors:</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && (
        <div>
          <PreviewTable rows={rows} errors={validationErrors} />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinueToConfirm}
              className="btn btn-primary"
              disabled={!canProceedToImport}
            >
              {canProceedToImport ? 'Continue' : 'Fix Errors to Continue'}
            </button>
          </div>

          {!canProceedToImport && (
            <p style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
              Please fix all validation errors before importing. Upload a corrected CSV file.
            </p>
          )}
        </div>
      )}

      {/* Confirm step */}
      {step === 'confirm' && (
        <div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Import Summary</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div>
                <strong>{propertyGroups.length}</strong> properties will be created
              </div>
              <div>
                <strong>{rows.length}</strong> units will be created
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
            Properties to Import:
          </h4>
          <ul style={{ margin: '0 0 1.5rem', paddingLeft: '1.25rem' }}>
            {propertyGroups.map((group, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                <strong>{group.propertyData.name}</strong> ({group.units.length} units)
                <span style={{ color: 'var(--secondary)' }}>
                  {' - '}{group.propertyData.address}, {group.propertyData.city}, {group.propertyData.state}
                </span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="btn"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="btn btn-primary"
            >
              Import {propertyGroups.length} Properties
            </button>
          </div>
        </div>
      )}

      {/* Importing step */}
      {step === 'importing' && (
        <ImportProgress
          current={importProgress.current}
          total={importProgress.total}
          result={null}
        />
      )}

      {/* Complete step */}
      {step === 'complete' && (
        <div>
          <ImportProgress
            current={propertyGroups.length}
            total={propertyGroups.length}
            result={importResult}
          />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn"
            >
              Import More
            </button>
            <a
              href="/landlord/properties"
              className="btn btn-primary"
            >
              View Properties
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: active ? 'var(--accent)' : completed ? '#f0fdf4' : 'var(--surface)',
        color: active ? 'white' : completed ? '#16a34a' : 'var(--secondary)',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        border: `1px solid ${active ? 'var(--accent)' : completed ? '#bbf7d0' : 'var(--border)'}`,
      }}
    >
      <span
        style={{
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '50%',
          backgroundColor: active ? 'white' : completed ? '#16a34a' : 'var(--border)',
          color: active ? 'var(--accent)' : completed ? 'white' : 'var(--secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {completed ? '✓' : step}
      </span>
      {label}
    </div>
  );
}
