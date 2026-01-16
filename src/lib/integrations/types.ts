/**
 * Stripe integration settings
 */
export interface StripeSettings {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

/**
 * SMTP/Email integration settings
 */
export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  appName: string;
}

/**
 * Google OAuth integration settings
 */
export interface OAuthGoogleSettings {
  clientId: string;
  clientSecret: string;
}

/**
 * GitHub OAuth integration settings
 */
export interface OAuthGithubSettings {
  clientId: string;
  clientSecret: string;
}

/**
 * Storage integration settings
 */
export interface StorageSettings {
  provider: 'local' | 's3' | 'r2' | 'do_spaces';
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
}

/**
 * Map of all integration types
 */
export interface IntegrationSettingsMap {
  stripe: Partial<StripeSettings>;
  smtp: Partial<SmtpSettings>;
  oauth_google: Partial<OAuthGoogleSettings>;
  oauth_github: Partial<OAuthGithubSettings>;
  storage: Partial<StorageSettings>;
}

export type IntegrationKey = keyof IntegrationSettingsMap;

/**
 * Fields that should be encrypted when stored
 */
export const ENCRYPTED_FIELDS: Record<IntegrationKey, string[]> = {
  stripe: ['secretKey', 'webhookSecret'],
  smtp: ['pass'],
  oauth_google: ['clientSecret'],
  oauth_github: ['clientSecret'],
  storage: ['secretAccessKey'],
};

/**
 * Human-readable names for integrations
 */
export const INTEGRATION_NAMES: Record<IntegrationKey, string> = {
  stripe: 'Stripe Payments',
  smtp: 'Email (SMTP)',
  oauth_google: 'Google OAuth',
  oauth_github: 'GitHub OAuth',
  storage: 'Document Storage',
};

/**
 * Field metadata for UI forms
 */
export interface FieldMeta {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const STRIPE_FIELDS: FieldMeta[] = [
  {
    key: 'secretKey',
    label: 'Secret Key',
    type: 'password',
    placeholder: 'sk_live_...',
    helpText: 'Your Stripe secret key (starts with sk_)',
    required: true,
  },
  {
    key: 'publishableKey',
    label: 'Publishable Key',
    type: 'text',
    placeholder: 'pk_live_...',
    helpText: 'Your Stripe publishable key (starts with pk_)',
    required: true,
  },
  {
    key: 'webhookSecret',
    label: 'Webhook Secret',
    type: 'password',
    placeholder: 'whsec_...',
    helpText: 'For verifying webhook signatures',
    required: false,
  },
];

export const SMTP_FIELDS: FieldMeta[] = [
  {
    key: 'host',
    label: 'SMTP Host',
    type: 'text',
    placeholder: 'smtp.gmail.com',
    helpText: 'Your email server hostname',
    required: true,
  },
  {
    key: 'port',
    label: 'Port',
    type: 'number',
    placeholder: '587',
    helpText: 'Usually 587 (TLS) or 465 (SSL)',
    required: true,
  },
  {
    key: 'secure',
    label: 'Use SSL/TLS',
    type: 'boolean',
    helpText: 'Enable for port 465, disable for port 587 with STARTTLS',
    required: false,
  },
  {
    key: 'user',
    label: 'Username',
    type: 'text',
    placeholder: 'your-email@gmail.com',
    helpText: 'SMTP authentication username',
    required: true,
  },
  {
    key: 'pass',
    label: 'Password',
    type: 'password',
    placeholder: 'App password or API key',
    helpText: 'SMTP authentication password',
    required: true,
  },
  {
    key: 'fromAddress',
    label: 'From Address',
    type: 'text',
    placeholder: 'noreply@your-domain.com',
    helpText: 'Email address shown as sender',
    required: true,
  },
  {
    key: 'appName',
    label: 'App Name',
    type: 'text',
    placeholder: 'PMS Platform',
    helpText: 'Name shown in email templates',
    required: false,
  },
];

export const OAUTH_GOOGLE_FIELDS: FieldMeta[] = [
  {
    key: 'clientId',
    label: 'Client ID',
    type: 'text',
    placeholder: '123456789.apps.googleusercontent.com',
    helpText: 'Google Cloud Console OAuth client ID',
    required: true,
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    placeholder: 'GOCSPX-...',
    helpText: 'Google Cloud Console OAuth client secret',
    required: true,
  },
];

export const OAUTH_GITHUB_FIELDS: FieldMeta[] = [
  {
    key: 'clientId',
    label: 'Client ID',
    type: 'text',
    placeholder: 'Iv1.abc123...',
    helpText: 'GitHub OAuth App client ID',
    required: true,
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    placeholder: 'abc123...',
    helpText: 'GitHub OAuth App client secret',
    required: true,
  },
];

export const STORAGE_FIELDS: FieldMeta[] = [
  {
    key: 'provider',
    label: 'Storage Provider',
    type: 'select',
    helpText: 'Where to store uploaded files',
    required: true,
    options: [
      { value: 'local', label: 'Local Filesystem' },
      { value: 's3', label: 'AWS S3' },
      { value: 'r2', label: 'Cloudflare R2' },
      { value: 'do_spaces', label: 'DigitalOcean Spaces' },
    ],
  },
  {
    key: 'bucket',
    label: 'Bucket Name',
    type: 'text',
    placeholder: 'my-pms-documents',
    helpText: 'S3/R2/Spaces bucket name',
    required: false,
  },
  {
    key: 'region',
    label: 'Region',
    type: 'text',
    placeholder: 'us-east-1 or auto',
    helpText: 'AWS region (use "auto" for R2)',
    required: false,
  },
  {
    key: 'endpoint',
    label: 'Custom Endpoint',
    type: 'text',
    placeholder: 'https://xxx.r2.cloudflarestorage.com',
    helpText: 'Required for R2 and DigitalOcean Spaces',
    required: false,
  },
  {
    key: 'accessKeyId',
    label: 'Access Key ID',
    type: 'text',
    placeholder: 'AKIA...',
    helpText: 'S3-compatible access key',
    required: false,
  },
  {
    key: 'secretAccessKey',
    label: 'Secret Access Key',
    type: 'password',
    placeholder: 'Your secret key',
    helpText: 'S3-compatible secret key',
    required: false,
  },
  {
    key: 'publicUrl',
    label: 'Public URL (Optional)',
    type: 'text',
    placeholder: 'https://cdn.example.com',
    helpText: 'CDN or public URL prefix for files',
    required: false,
  },
];
