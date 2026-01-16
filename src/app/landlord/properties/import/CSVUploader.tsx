'use client';

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { type ParsedRow, CSV_HEADERS } from '@/lib/csvValidation';

interface CSVUploaderProps {
  onParsed: (rows: ParsedRow[], parseErrors: string[]) => void;
}

export default function CSVUploader({ onParsed }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setParsing(true);
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (result) => {
        setParsing(false);
        const parseErrors: string[] = [];

        if (result.errors.length > 0) {
          for (const err of result.errors) {
            parseErrors.push(`Row ${(err.row || 0) + 2}: ${err.message}`);
          }
        }

        // Validate headers
        const headers = result.meta.fields || [];
        const requiredHeaders = ['property_name', 'property_type', 'address', 'city', 'state', 'zip', 'bedrooms', 'bathrooms', 'rent_amount'];
        const missingRequired = requiredHeaders.filter(h => !headers.includes(h));
        if (missingRequired.length > 0) {
          parseErrors.push(`Missing required columns: ${missingRequired.join(', ')}`);
        }

        if (result.data.length === 0) {
          parseErrors.push('CSV file is empty');
        }

        const rows: ParsedRow[] = result.data.map((row, index) => ({
          rowNumber: index + 2,
          property_name: row.property_name || '',
          property_type: row.property_type || '',
          address: row.address || '',
          city: row.city || '',
          state: row.state || '',
          zip: row.zip || '',
          year_built: row.year_built,
          property_description: row.property_description,
          unit_number: row.unit_number,
          bedrooms: row.bedrooms || '',
          bathrooms: row.bathrooms || '',
          sqft: row.sqft,
          rent_amount: row.rent_amount || '',
          deposit_amount: row.deposit_amount,
          status: row.status,
          features: row.features,
          unit_description: row.unit_description,
        }));

        onParsed(rows, parseErrors);
      },
      error: (err) => {
        setParsing(false);
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, [onParsed]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    parseFile(files[0]);
  }, [parseFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const reset = useCallback(() => {
    setFileName(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
          transition: 'all var(--transition-fast)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        {parsing ? (
          <p style={{ color: 'var(--secondary)' }}>Parsing CSV...</p>
        ) : fileName ? (
          <>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>CSV</p>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>{fileName}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              Choose Different File
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>CSV</p>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>
              {dragActive ? 'Drop CSV file here' : 'Click or drag CSV file to upload'}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--secondary)' }}>
              .csv files only
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
