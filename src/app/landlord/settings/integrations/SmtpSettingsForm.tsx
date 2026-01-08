'use client';

import { useActionState, useState } from 'react';
import {
  saveSmtpSettingsAction,
  testSmtpConnectionAction,
  importEnvSettingsAction,
  clearIntegrationSettingsAction,
} from '@/app/actions/integrations';

type FormState = {
  success: boolean;
  error?: string;
} | null;

interface Props {
  organizationId: string;
  hasCustomSettings: boolean;
  envHasDefaults: boolean;
}

export default function SmtpSettingsForm({
  organizationId,
  hasCustomSettings,
  envHasDefaults,
}: Props) {
  const [state, formAction, isPending] = useActionState(saveSmtpSettingsAction, null);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleTest = async (formData: FormData) => {
    const host = formData.get('host') as string;
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;

    if (!host || !user || !pass) {
      setTestResult({ valid: false, message: 'Host, username, and password are required' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const result = await testSmtpConnectionAction(formData);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    await importEnvSettingsAction('smtp');
    setIsImporting(false);
    window.location.reload();
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear these settings? You will fall back to system defaults.')) {
      return;
    }
    setIsClearing(true);
    await clearIntegrationSettingsAction('smtp');
    setIsClearing(false);
    window.location.reload();
  };

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
            Email (SMTP)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
            Send notification emails to tenants and team members
          </p>
        </div>
        <StatusBadge hasCustom={hasCustomSettings} hasEnvDefault={envHasDefaults} />
      </div>

      <form action={formAction}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <FormField
              label="SMTP Host"
              name="host"
              type="text"
              placeholder="smtp.gmail.com"
              helpText="Your email server hostname"
            />

            <FormField
              label="Port"
              name="port"
              type="number"
              placeholder="587"
              helpText="Usually 587 or 465"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="secure" name="secure" value="true" />
            <label htmlFor="secure" style={{ fontSize: '0.875rem' }}>
              Use SSL/TLS (enable for port 465)
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField
              label="Username"
              name="user"
              type="text"
              placeholder="your-email@gmail.com"
              helpText="SMTP authentication username"
            />

            <FormField
              label="Password"
              name="pass"
              type="password"
              placeholder="App password or API key"
              helpText="SMTP authentication password"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField
              label="From Address"
              name="fromAddress"
              type="text"
              placeholder="noreply@your-domain.com"
              helpText="Email address shown as sender"
            />

            <FormField
              label="App Name"
              name="appName"
              type="text"
              placeholder="PMS Platform"
              helpText="Name shown in email templates"
            />
          </div>
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

          <button
            type="button"
            className="btn"
            disabled={isTesting}
            onClick={(e) => {
              const form = e.currentTarget.closest('form');
              if (form) handleTest(new FormData(form));
            }}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          {envHasDefaults && !hasCustomSettings && (
            <button
              type="button"
              className="btn"
              disabled={isImporting}
              onClick={handleImport}
            >
              {isImporting ? 'Importing...' : 'Import from System'}
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
              {isClearing ? 'Clearing...' : 'Clear Settings'}
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
            SMTP settings saved successfully
          </div>
        )}

        {testResult && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: testResult.valid ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${testResult.valid ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 'var(--radius)',
              color: testResult.valid ? '#16a34a' : '#dc2626',
              fontSize: '0.875rem',
            }}
          >
            {testResult.message}
          </div>
        )}
      </form>
    </section>
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
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
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
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
        }}
      >
        System Default
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
      Not Configured
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
  type: 'text' | 'password' | 'number';
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
