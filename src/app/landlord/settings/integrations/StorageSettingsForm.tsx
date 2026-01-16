'use client';

import { useActionState, useState } from 'react';
import {
  saveStorageSettingsAction,
  clearIntegrationSettingsAction,
} from '@/app/actions/integrations';

type FormState = {
  success: boolean;
  error?: string;
} | null;

interface Props {
  organizationId: string;
  hasCustomSettings: boolean;
  currentProvider: string;
}

export default function StorageSettingsForm({
  organizationId,
  hasCustomSettings,
  currentProvider,
}: Props) {
  const [state, formAction, isPending] = useActionState(saveStorageSettingsAction, null);
  const [isClearing, setIsClearing] = useState(false);
  const [provider, setProvider] = useState(currentProvider || 'local');

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear storage settings? You will fall back to local storage.')) {
      return;
    }
    setIsClearing(true);
    await clearIntegrationSettingsAction('storage');
    setIsClearing(false);
    window.location.reload();
  };

  const showCloudFields = provider !== 'local';

  return (
    <section className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            Document Storage
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
            Where to store uploaded documents and photos
          </p>
        </div>
        <StatusBadge provider={currentProvider} hasCustom={hasCustomSettings} />
      </div>

      <form action={formAction}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label
              htmlFor="provider"
              style={{ fontSize: '0.875rem', fontWeight: '500' }}
            >
              Storage Provider
            </label>
            <select
              id="provider"
              name="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                backgroundColor: 'white',
              }}
            >
              <option value="local">Local Filesystem</option>
              <option value="s3">AWS S3</option>
              <option value="r2">Cloudflare R2</option>
              <option value="do_spaces">DigitalOcean Spaces</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              Where to store uploaded files
            </span>
          </div>

          {showCloudFields && (
            <>
              <FormField
                label="Bucket Name"
                name="bucket"
                type="text"
                placeholder="my-pms-documents"
                helpText="S3/R2/Spaces bucket name"
              />

              <FormField
                label="Region"
                name="region"
                type="text"
                placeholder="us-east-1 or auto"
                helpText="AWS region (use 'auto' for R2)"
              />

              <FormField
                label="Custom Endpoint"
                name="endpoint"
                type="text"
                placeholder="https://xxx.r2.cloudflarestorage.com"
                helpText="Required for R2 and DigitalOcean Spaces"
              />

              <FormField
                label="Access Key ID"
                name="accessKeyId"
                type="text"
                placeholder="AKIA..."
                helpText="S3-compatible access key"
              />

              <FormField
                label="Secret Access Key"
                name="secretAccessKey"
                type="password"
                placeholder="Your secret key"
                helpText="S3-compatible secret key"
              />

              <FormField
                label="Public URL (Optional)"
                name="publicUrl"
                type="text"
                placeholder="https://cdn.example.com"
                helpText="CDN or public URL prefix for files"
              />
            </>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Settings'}
          </button>

          {hasCustomSettings && (
            <button
              type="button"
              className="btn"
              style={{ color: '#dc2626' }}
              disabled={isClearing}
              onClick={handleClear}
            >
              {isClearing ? 'Clearing...' : 'Reset to Local'}
            </button>
          )}
        </div>

        {state?.error && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              color: '#dc2626',
              fontSize: '0.875rem',
            }}
          >
            {state.error}
          </div>
        )}

        {state?.success && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius)',
              color: '#16a34a',
              fontSize: '0.875rem',
            }}
          >
            Storage settings saved successfully
          </div>
        )}
      </form>
    </section>
  );
}

function StatusBadge({ provider, hasCustom }: { provider: string; hasCustom: boolean }) {
  if (hasCustom && provider !== 'local') {
    return (
      <span
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: '#d1fae5',
          color: '#047857',
        }}
      >
        {provider === 's3' ? 'AWS S3' : provider === 'r2' ? 'Cloudflare R2' : provider === 'do_spaces' ? 'DO Spaces' : 'Cloud'}
      </span>
    );
  }

  return (
    <span
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
      }}
    >
      Local
    </span>
  );
}

function FormField({
  label,
  name,
  type,
  placeholder,
  helpText,
}: {
  label: string;
  name: string;
  type: 'text' | 'password';
  placeholder?: string;
  helpText?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label
        htmlFor={name}
        style={{ fontSize: '0.875rem', fontWeight: '500' }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={type === 'password' && showPassword ? 'text' : type}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            paddingRight: type === 'password' ? '3rem' : '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
          }}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--secondary)',
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {helpText && (
        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{helpText}</span>
      )}
    </div>
  );
}
