'use client';

import { useActionState, useState } from 'react';
import {
  saveOAuthGoogleSettingsAction,
  saveOAuthGithubSettingsAction,
  importEnvSettingsAction,
  clearIntegrationSettingsAction,
} from '@/app/actions/integrations';

type FormState = {
  success: boolean;
  error?: string;
} | null;

interface Props {
  organizationId: string;
  hasGoogleSettings: boolean;
  hasGithubSettings: boolean;
  envHasGoogleDefaults: boolean;
  envHasGithubDefaults: boolean;
}

export default function OAuthSettingsForm({
  organizationId,
  hasGoogleSettings,
  hasGithubSettings,
  envHasGoogleDefaults,
  envHasGithubDefaults,
}: Props) {
  return (
    <section className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          OAuth Providers
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
          Allow users to sign in with Google or GitHub
        </p>
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius)',
            fontSize: '0.75rem',
            color: '#92400e',
          }}
        >
          <strong>Note:</strong> Per-organization OAuth requires additional configuration.
          These settings are stored but may require a server restart to take effect.
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthForm
        hasCustomSettings={hasGoogleSettings}
        envHasDefaults={envHasGoogleDefaults}
      />

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

      {/* GitHub OAuth */}
      <GitHubOAuthForm
        hasCustomSettings={hasGithubSettings}
        envHasDefaults={envHasGithubDefaults}
      />
    </section>
  );
}

function GoogleOAuthForm({
  hasCustomSettings,
  envHasDefaults,
}: {
  hasCustomSettings: boolean;
  envHasDefaults: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveOAuthGoogleSettingsAction, null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    await importEnvSettingsAction('oauth_google');
    setIsImporting(false);
    window.location.reload();
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear Google OAuth settings?')) {
      return;
    }
    setIsClearing(true);
    await clearIntegrationSettingsAction('oauth_google');
    setIsClearing(false);
    window.location.reload();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Google OAuth</h3>
        <StatusBadge hasCustom={hasCustomSettings} hasEnvDefault={envHasDefaults} />
      </div>

      <form action={formAction}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <FormField
            label="Client ID"
            name="clientId"
            type="text"
            placeholder="123456789.apps.googleusercontent.com"
            helpText="From Google Cloud Console"
          />

          <FormField
            label="Client Secret"
            name="clientSecret"
            type="password"
            placeholder="GOCSPX-..."
            helpText="Keep this secret!"
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </button>

          {envHasDefaults && !hasCustomSettings && (
            <button
              type="button"
              className="btn"
              disabled={isImporting}
              onClick={handleImport}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          )}

          {hasCustomSettings && (
            <button
              type="button"
              className="btn"
              style={{ color: '#dc2626' }}
              disabled={isClearing}
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>

        {state?.error && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#fef2f2',
              borderRadius: 'var(--radius)',
              color: '#dc2626',
              fontSize: '0.75rem',
            }}
          >
            {state.error}
          </div>
        )}

        {state?.success && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#f0fdf4',
              borderRadius: 'var(--radius)',
              color: '#16a34a',
              fontSize: '0.75rem',
            }}
          >
            Google OAuth settings saved
          </div>
        )}
      </form>
    </div>
  );
}

function GitHubOAuthForm({
  hasCustomSettings,
  envHasDefaults,
}: {
  hasCustomSettings: boolean;
  envHasDefaults: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveOAuthGithubSettingsAction, null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    await importEnvSettingsAction('oauth_github');
    setIsImporting(false);
    window.location.reload();
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear GitHub OAuth settings?')) {
      return;
    }
    setIsClearing(true);
    await clearIntegrationSettingsAction('oauth_github');
    setIsClearing(false);
    window.location.reload();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>GitHub OAuth</h3>
        <StatusBadge hasCustom={hasCustomSettings} hasEnvDefault={envHasDefaults} />
      </div>

      <form action={formAction}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <FormField
            label="Client ID"
            name="clientId"
            type="text"
            placeholder="Iv1.abc123..."
            helpText="From GitHub OAuth App settings"
          />

          <FormField
            label="Client Secret"
            name="clientSecret"
            type="password"
            placeholder="abc123..."
            helpText="Keep this secret!"
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </button>

          {envHasDefaults && !hasCustomSettings && (
            <button
              type="button"
              className="btn"
              disabled={isImporting}
              onClick={handleImport}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          )}

          {hasCustomSettings && (
            <button
              type="button"
              className="btn"
              style={{ color: '#dc2626' }}
              disabled={isClearing}
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>

        {state?.error && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#fef2f2',
              borderRadius: 'var(--radius)',
              color: '#dc2626',
              fontSize: '0.75rem',
            }}
          >
            {state.error}
          </div>
        )}

        {state?.success && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#f0fdf4',
              borderRadius: 'var(--radius)',
              color: '#16a34a',
              fontSize: '0.75rem',
            }}
          >
            GitHub OAuth settings saved
          </div>
        )}
      </form>
    </div>
  );
}

function StatusBadge({
  hasCustom,
  hasEnvDefault,
}: {
  hasCustom: boolean;
  hasEnvDefault: boolean;
}) {
  if (hasCustom) {
    return (
      <span
        style={{
          padding: '0.125rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: '600',
          backgroundColor: '#d1fae5',
          color: '#047857',
        }}
      >
        Custom
      </span>
    );
  }

  if (hasEnvDefault) {
    return (
      <span
        style={{
          padding: '0.125rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: '600',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
        }}
      >
        System
      </span>
    );
  }

  return (
    <span
      style={{
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: '600',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
      }}
    >
      None
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
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
        }}
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
