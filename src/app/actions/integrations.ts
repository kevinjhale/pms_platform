'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getOrgContext } from '@/lib/org-context';
import { getUserRoleInOrganization } from '@/services/organizations';
import {
  setIntegrationSettings,
  deleteIntegrationSettings,
  getIntegrationSettings,
  getEnvDefaults,
  hasIntegrationSettings,
  getMaskedSettings,
} from '@/services/integrationSettings';
import { testStripeConnection, clearStripeCache } from '@/services/stripe';
import { testSmtpConnection, clearEmailCache } from '@/services/email';
import type { IntegrationKey } from '@/lib/integrations/types';

type ActionResult = {
  success: boolean;
  error?: string;
};

type TestResult = {
  valid: boolean;
  message: string;
};

async function requireOrgAdmin(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    return null;
  }

  const role = await getUserRoleInOrganization(session.user.id, organization.id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return null;
  }

  return {
    userId: session.user.id,
    organizationId: organization.id,
    role,
  };
}

// ============= Stripe Actions =============

export async function saveStripeSettingsAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const secretKey = formData.get('secretKey') as string;
  const publishableKey = formData.get('publishableKey') as string;
  const webhookSecret = formData.get('webhookSecret') as string;

  // Validate key formats
  if (secretKey && !secretKey.startsWith('sk_')) {
    return { success: false, error: 'Secret key must start with sk_' };
  }
  if (publishableKey && !publishableKey.startsWith('pk_')) {
    return { success: false, error: 'Publishable key must start with pk_' };
  }
  if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
    return { success: false, error: 'Webhook secret must start with whsec_' };
  }

  try {
    await setIntegrationSettings(context.organizationId, 'stripe', {
      secretKey: secretKey || undefined,
      publishableKey: publishableKey || undefined,
      webhookSecret: webhookSecret || undefined,
    });

    // Clear cache so new settings take effect
    clearStripeCache(context.organizationId);

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to save Stripe settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

export async function testStripeConnectionAction(secretKey: string): Promise<TestResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { valid: false, message: 'Permission denied' };
  }

  if (!secretKey) {
    return { valid: false, message: 'Secret key is required' };
  }

  return testStripeConnection(secretKey);
}

// ============= SMTP Actions =============

export async function saveSmtpSettingsAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const host = formData.get('host') as string;
  const portStr = formData.get('port') as string;
  const secure = formData.get('secure') === 'true';
  const user = formData.get('user') as string;
  const pass = formData.get('pass') as string;
  const fromAddress = formData.get('fromAddress') as string;
  const appName = formData.get('appName') as string;

  const port = portStr ? parseInt(portStr, 10) : undefined;

  // Validate email format
  if (fromAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    return { success: false, error: 'Invalid from address format' };
  }

  try {
    await setIntegrationSettings(context.organizationId, 'smtp', {
      host: host || undefined,
      port,
      secure,
      user: user || undefined,
      pass: pass || undefined,
      fromAddress: fromAddress || undefined,
      appName: appName || undefined,
    });

    // Clear cache so new settings take effect
    clearEmailCache(context.organizationId);

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to save SMTP settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

export async function testSmtpConnectionAction(formData: FormData): Promise<TestResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { valid: false, message: 'Permission denied' };
  }

  const host = formData.get('host') as string;
  const portStr = formData.get('port') as string;
  const secure = formData.get('secure') === 'true';
  const user = formData.get('user') as string;
  const pass = formData.get('pass') as string;

  return testSmtpConnection({
    host,
    port: portStr ? parseInt(portStr, 10) : 587,
    secure,
    user,
    pass,
  });
}

// ============= OAuth Actions =============

export async function saveOAuthGoogleSettingsAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const clientId = formData.get('clientId') as string;
  const clientSecret = formData.get('clientSecret') as string;

  try {
    await setIntegrationSettings(context.organizationId, 'oauth_google', {
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
    });

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to save Google OAuth settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

export async function saveOAuthGithubSettingsAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const clientId = formData.get('clientId') as string;
  const clientSecret = formData.get('clientSecret') as string;

  try {
    await setIntegrationSettings(context.organizationId, 'oauth_github', {
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
    });

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to save GitHub OAuth settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

// ============= General Actions =============

export async function importEnvSettingsAction(
  integration: IntegrationKey
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const envDefaults = getEnvDefaults();
  const settings = envDefaults[integration];

  // Filter out empty values
  const nonEmptySettings = Object.fromEntries(
    Object.entries(settings).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null
    )
  );

  if (Object.keys(nonEmptySettings).length === 0) {
    return { success: false, error: 'No system defaults configured for this integration' };
  }

  try {
    await setIntegrationSettings(
      context.organizationId,
      integration,
      nonEmptySettings as Parameters<typeof setIntegrationSettings>[2]
    );

    // Clear relevant caches
    if (integration === 'stripe') clearStripeCache(context.organizationId);
    if (integration === 'smtp') clearEmailCache(context.organizationId);

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to import settings:', error);
    return { success: false, error: 'Failed to import settings' };
  }
}

export async function clearIntegrationSettingsAction(
  integration: IntegrationKey
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  try {
    await deleteIntegrationSettings(context.organizationId, integration);

    // Clear relevant caches
    if (integration === 'stripe') clearStripeCache(context.organizationId);
    if (integration === 'smtp') clearEmailCache(context.organizationId);

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to clear settings:', error);
    return { success: false, error: 'Failed to clear settings' };
  }
}

export async function getIntegrationStatusAction(): Promise<{
  stripe: { hasCustom: boolean; hasEnvDefault: boolean };
  smtp: { hasCustom: boolean; hasEnvDefault: boolean };
  oauth_google: { hasCustom: boolean; hasEnvDefault: boolean };
  oauth_github: { hasCustom: boolean; hasEnvDefault: boolean };
} | null> {
  const context = await requireOrgAdmin();
  if (!context) {
    return null;
  }

  const envDefaults = getEnvDefaults();

  const [hasStripe, hasSmtp, hasOAuthGoogle, hasOAuthGithub] = await Promise.all([
    hasIntegrationSettings(context.organizationId, 'stripe'),
    hasIntegrationSettings(context.organizationId, 'smtp'),
    hasIntegrationSettings(context.organizationId, 'oauth_google'),
    hasIntegrationSettings(context.organizationId, 'oauth_github'),
  ]);

  return {
    stripe: {
      hasCustom: hasStripe,
      hasEnvDefault: !!envDefaults.stripe.secretKey,
    },
    smtp: {
      hasCustom: hasSmtp,
      hasEnvDefault: !!envDefaults.smtp.user,
    },
    oauth_google: {
      hasCustom: hasOAuthGoogle,
      hasEnvDefault: !!envDefaults.oauth_google.clientId,
    },
    oauth_github: {
      hasCustom: hasOAuthGithub,
      hasEnvDefault: !!envDefaults.oauth_github.clientId,
    },
  };
}

export async function getMaskedSettingsAction(
  integration: IntegrationKey
): Promise<Record<string, string> | null> {
  const context = await requireOrgAdmin();
  if (!context) {
    return null;
  }

  return getMaskedSettings(context.organizationId, integration);
}

// ============= Storage Actions =============

export async function saveStorageSettingsAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const context = await requireOrgAdmin();
  if (!context) {
    return { success: false, error: 'Permission denied' };
  }

  const provider = formData.get('provider') as string;
  const bucket = formData.get('bucket') as string;
  const region = formData.get('region') as string;
  const endpoint = formData.get('endpoint') as string;
  const accessKeyId = formData.get('accessKeyId') as string;
  const secretAccessKey = formData.get('secretAccessKey') as string;
  const publicUrl = formData.get('publicUrl') as string;

  // Validate cloud provider settings
  if (provider !== 'local') {
    if (!bucket) {
      return { success: false, error: 'Bucket name is required for cloud storage' };
    }
    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: 'Access credentials are required for cloud storage' };
    }
    if ((provider === 'r2' || provider === 'do_spaces') && !endpoint) {
      return { success: false, error: 'Custom endpoint is required for R2 and DigitalOcean Spaces' };
    }
  }

  try {
    await setIntegrationSettings(context.organizationId, 'storage', {
      provider: provider as 'local' | 's3' | 'r2' | 'do_spaces',
      bucket: bucket || undefined,
      region: region || undefined,
      endpoint: endpoint || undefined,
      accessKeyId: accessKeyId || undefined,
      secretAccessKey: secretAccessKey || undefined,
      publicUrl: publicUrl || undefined,
    });

    revalidatePath('/landlord/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to save storage settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}
