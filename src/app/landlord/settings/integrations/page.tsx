import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import { getUserRoleInOrganization } from '@/services/organizations';
import {
  hasIntegrationSettings,
  getEnvDefaults,
  envHasDefaults,
} from '@/services/integrationSettings';
import StripeSettingsForm from './StripeSettingsForm';
import SmtpSettingsForm from './SmtpSettingsForm';
import OAuthSettingsForm from './OAuthSettingsForm';

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { organization } = await getOrgContext();
  if (!organization) redirect('/onboarding');

  const role = await getUserRoleInOrganization(session.user.id, organization.id);
  if (!role || !['owner', 'admin'].includes(role)) {
    redirect('/landlord/settings');
  }

  // Check which integrations have custom settings
  const [hasStripe, hasSmtp, hasOAuthGoogle, hasOAuthGithub] = await Promise.all([
    hasIntegrationSettings(organization.id, 'stripe'),
    hasIntegrationSettings(organization.id, 'smtp'),
    hasIntegrationSettings(organization.id, 'oauth_google'),
    hasIntegrationSettings(organization.id, 'oauth_github'),
  ]);

  const envDefaults = getEnvDefaults();

  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <Link
          href="/landlord/settings"
          style={{
            fontSize: '0.875rem',
            color: 'var(--secondary)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Settings
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Integrations</h1>
        <p style={{ color: 'var(--secondary)' }}>
          Configure third-party service connections for your organization
        </p>
      </div>

      {/* Info banner if using env defaults */}
      {!hasStripe && !hasSmtp && envHasDefaults('stripe') && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Note:</strong> Your organization is using system-wide default settings.
            Configure your own credentials below for custom branding and separate billing.
          </p>
        </div>
      )}

      {/* Stripe Settings */}
      <StripeSettingsForm
        organizationId={organization.id}
        hasCustomSettings={hasStripe}
        envHasDefaults={!!envDefaults.stripe.secretKey}
      />

      {/* SMTP Settings */}
      <SmtpSettingsForm
        organizationId={organization.id}
        hasCustomSettings={hasSmtp}
        envHasDefaults={!!envDefaults.smtp.user}
      />

      {/* OAuth Settings */}
      <OAuthSettingsForm
        organizationId={organization.id}
        hasGoogleSettings={hasOAuthGoogle}
        hasGithubSettings={hasOAuthGithub}
        envHasGoogleDefaults={!!envDefaults.oauth_google.clientId}
        envHasGithubDefaults={!!envDefaults.oauth_github.clientId}
      />

      {/* Footer Note */}
      <div
        style={{
          padding: '1rem',
          marginTop: '2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem',
          color: 'var(--secondary)',
        }}
      >
        <strong>Security Note:</strong> All API keys and secrets are encrypted at rest using
        AES-256-GCM encryption. Only authorized administrators can view or modify these settings.
      </div>
    </main>
  );
}
