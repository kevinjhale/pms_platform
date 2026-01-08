import { eq, and } from 'drizzle-orm';
import { getDb, integrationSettings } from '@/db';
import { generateId, now } from '@/lib/utils';
import { encrypt, safeDecrypt } from '@/lib/crypto';
import {
  IntegrationKey,
  IntegrationSettingsMap,
  ENCRYPTED_FIELDS,
  StripeSettings,
  SmtpSettings,
} from '@/lib/integrations/types';

/**
 * Get all settings for an integration, with decryption
 */
export async function getIntegrationSettings<K extends IntegrationKey>(
  organizationId: string,
  integrationKey: K
): Promise<IntegrationSettingsMap[K]> {
  const db = getDb();

  const rows = await db
    .select()
    .from(integrationSettings)
    .where(
      and(
        eq(integrationSettings.organizationId, organizationId),
        eq(integrationSettings.integrationKey, integrationKey)
      )
    );

  const settings: Record<string, unknown> = {};

  for (const row of rows) {
    let value: unknown = row.value;

    if (row.isEncrypted) {
      const decrypted = safeDecrypt(row.value);
      if (decrypted === null) continue; // Skip if decryption fails
      value = decrypted;
    }

    // Type conversion for known fields
    if (integrationKey === 'smtp') {
      if (row.settingKey === 'port') {
        value = parseInt(value as string, 10);
      }
      if (row.settingKey === 'secure') {
        value = value === 'true';
      }
    }

    settings[row.settingKey] = value;
  }

  return settings as IntegrationSettingsMap[K];
}

/**
 * Set settings for an integration (upsert), with encryption for sensitive fields
 */
export async function setIntegrationSettings<K extends IntegrationKey>(
  organizationId: string,
  integrationKey: K,
  settings: Partial<IntegrationSettingsMap[K]>
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  const encryptedFields = ENCRYPTED_FIELDS[integrationKey] || [];

  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined || value === null || value === '') continue;

    const shouldEncrypt = encryptedFields.includes(key);
    const stringValue = String(value);
    const storedValue = shouldEncrypt ? encrypt(stringValue) : stringValue;

    // Check if exists
    const existing = await db
      .select()
      .from(integrationSettings)
      .where(
        and(
          eq(integrationSettings.organizationId, organizationId),
          eq(integrationSettings.integrationKey, integrationKey),
          eq(integrationSettings.settingKey, key)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(integrationSettings)
        .set({
          value: storedValue,
          isEncrypted: shouldEncrypt,
          updatedAt: timestamp,
        })
        .where(eq(integrationSettings.id, existing[0].id));
    } else {
      await db.insert(integrationSettings).values({
        id: generateId(),
        organizationId,
        integrationKey,
        settingKey: key,
        value: storedValue,
        isEncrypted: shouldEncrypt,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
}

/**
 * Delete a specific setting
 */
export async function deleteSetting(
  organizationId: string,
  integrationKey: IntegrationKey,
  settingKey: string
): Promise<void> {
  const db = getDb();

  await db
    .delete(integrationSettings)
    .where(
      and(
        eq(integrationSettings.organizationId, organizationId),
        eq(integrationSettings.integrationKey, integrationKey),
        eq(integrationSettings.settingKey, settingKey)
      )
    );
}

/**
 * Delete all settings for an integration
 */
export async function deleteIntegrationSettings(
  organizationId: string,
  integrationKey: IntegrationKey
): Promise<void> {
  const db = getDb();

  await db
    .delete(integrationSettings)
    .where(
      and(
        eq(integrationSettings.organizationId, organizationId),
        eq(integrationSettings.integrationKey, integrationKey)
      )
    );
}

/**
 * Check if org has custom settings for an integration
 */
export async function hasIntegrationSettings(
  organizationId: string,
  integrationKey: IntegrationKey
): Promise<boolean> {
  const db = getDb();

  const result = await db
    .select({ id: integrationSettings.id })
    .from(integrationSettings)
    .where(
      and(
        eq(integrationSettings.organizationId, organizationId),
        eq(integrationSettings.integrationKey, integrationKey)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Get settings with fallback to environment variables
 */
export async function getStripeSettingsWithFallback(
  organizationId: string
): Promise<Partial<StripeSettings>> {
  if (await hasIntegrationSettings(organizationId, 'stripe')) {
    const settings = await getIntegrationSettings(organizationId, 'stripe');
    if (settings.secretKey) return settings;
  }

  // Fallback to environment variables
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  };
}

export async function getSmtpSettingsWithFallback(
  organizationId: string
): Promise<Partial<SmtpSettings>> {
  if (await hasIntegrationSettings(organizationId, 'smtp')) {
    const settings = await getIntegrationSettings(organizationId, 'smtp');
    if (settings.host && settings.user) return settings;
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromAddress: process.env.EMAIL_FROM || 'noreply@pms-platform.local',
    appName: process.env.APP_NAME || 'PMS Platform',
  };
}

/**
 * Get environment defaults for import
 */
export function getEnvDefaults(): IntegrationSettingsMap {
  return {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromAddress: process.env.EMAIL_FROM || '',
      appName: process.env.APP_NAME || 'PMS Platform',
    },
    oauth_google: {
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    },
    oauth_github: {
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    },
  };
}

/**
 * Check if env has defaults for an integration
 */
export function envHasDefaults(integrationKey: IntegrationKey): boolean {
  const defaults = getEnvDefaults();

  switch (integrationKey) {
    case 'stripe':
      return !!defaults.stripe.secretKey;
    case 'smtp':
      return !!defaults.smtp.user;
    case 'oauth_google':
      return !!defaults.oauth_google.clientId;
    case 'oauth_github':
      return !!defaults.oauth_github.clientId;
    default:
      return false;
  }
}

/**
 * Get masked version of settings for display (shows only last 4 chars of secrets)
 */
export async function getMaskedSettings<K extends IntegrationKey>(
  organizationId: string,
  integrationKey: K
): Promise<Record<string, string>> {
  const settings = await getIntegrationSettings(organizationId, integrationKey);
  const encryptedFields = ENCRYPTED_FIELDS[integrationKey] || [];
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined || value === null) continue;

    if (encryptedFields.includes(key) && typeof value === 'string' && value.length > 4) {
      masked[key] = '•'.repeat(8) + value.slice(-4);
    } else {
      masked[key] = String(value);
    }
  }

  return masked;
}
