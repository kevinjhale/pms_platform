'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  existingUrls?: string[];
  maxFiles?: number;
}

export default function FileUpload({ onUpload, existingUrls = [], maxFiles = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingUrls);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - uploadedUrls.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const newUrls = [...uploadedUrls, ...data.urls];
      setUploadedUrls(newUrls);
      onUpload(newUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [uploadedUrls, maxFiles, onUpload]);

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

  const removeFile = useCallback((index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    onUpload(newUrls);
  }, [uploadedUrls, onUpload]);

  return (
    <div>
      {/* Drop Zone */}
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
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <p style={{ color: 'var(--secondary)' }}>Uploading...</p>
        ) : (
          <>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📷</p>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>
              {dragActive ? 'Drop files here' : 'Click or drag photos to upload'}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--secondary)' }}>
              Max {maxFiles} photos • JPEG, PNG, WebP, GIF • 5MB each
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}

      {/* Preview */}
      {uploadedUrls.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
          }}
        >
          {uploadedUrls.map((url, index) => (
            <div
              key={url}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                backgroundColor: 'var(--surface)',
              }}
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="photos" value={JSON.stringify(uploadedUrls)} />
    </div>
  );
}
