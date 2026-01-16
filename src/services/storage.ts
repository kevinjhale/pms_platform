import { createStorageAdapter, getDefaultConfig } from '@/lib/storage';
import type { StorageAdapter, StorageConfig, StorageProvider } from '@/lib/storage/types';
import { getIntegrationSettings, hasIntegrationSettings } from './integrationSettings';
import type { StorageSettings } from '@/lib/integrations/types';

/**
 * Get storage adapter for an organization
 * Priority: org settings > env variables > local fallback
 */
export async function getStorageAdapter(organizationId: string): Promise<StorageAdapter> {
  // Check for org-specific storage settings
  if (await hasIntegrationSettings(organizationId, 'storage')) {
    const settings = await getIntegrationSettings(organizationId, 'storage');

    if (settings.provider && settings.provider !== 'local') {
      const config: StorageConfig = {
        provider: settings.provider,
        bucket: settings.bucket,
        region: settings.region,
        endpoint: settings.endpoint,
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        publicUrl: settings.publicUrl,
      };
      return createStorageAdapter(config);
    }
  }

  // Check environment variables for default cloud storage
  if (process.env.STORAGE_PROVIDER && process.env.STORAGE_PROVIDER !== 'local') {
    const config: StorageConfig = {
      provider: process.env.STORAGE_PROVIDER as StorageProvider,
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION,
      endpoint: process.env.STORAGE_ENDPOINT,
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      publicUrl: process.env.STORAGE_PUBLIC_URL,
    };
    return createStorageAdapter(config);
  }

  // Fall back to local storage
  return createStorageAdapter(getDefaultConfig());
}

/**
 * Get storage settings with fallback to environment variables
 */
export async function getStorageSettingsWithFallback(
  organizationId: string
): Promise<Partial<StorageSettings>> {
  if (await hasIntegrationSettings(organizationId, 'storage')) {
    const settings = await getIntegrationSettings(organizationId, 'storage');
    if (settings.provider) return settings;
  }

  // Fallback to environment variables
  return {
    provider: (process.env.STORAGE_PROVIDER as StorageSettings['provider']) || 'local',
    bucket: process.env.STORAGE_BUCKET || '',
    region: process.env.STORAGE_REGION || '',
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '',
  };
}

/**
 * Check if storage is configured (either org-level or env-level)
 */
export async function hasStorageConfigured(organizationId: string): Promise<boolean> {
  if (await hasIntegrationSettings(organizationId, 'storage')) {
    return true;
  }
  return !!process.env.STORAGE_PROVIDER;
}

/**
 * Get the current storage provider name for display
 */
export async function getStorageProviderName(organizationId: string): Promise<string> {
  const settings = await getStorageSettingsWithFallback(organizationId);
  const providerNames: Record<string, string> = {
    local: 'Local Filesystem',
    s3: 'AWS S3',
    r2: 'Cloudflare R2',
    do_spaces: 'DigitalOcean Spaces',
  };
  return providerNames[settings.provider || 'local'] || 'Local Filesystem';
}
