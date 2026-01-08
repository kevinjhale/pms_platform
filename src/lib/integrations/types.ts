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
 * Map of all integration types
 */
export interface IntegrationSettingsMap {
  stripe: Partial<StripeSettings>;
  smtp: Partial<SmtpSettings>;
  oauth_google: Partial<OAuthGoogleSettings>;
  oauth_github: Partial<OAuthGithubSettings>;
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
};

/**
 * Human-readable names for integrations
 */
export const INTEGRATION_NAMES: Record<IntegrationKey, string> = {
  stripe: 'Stripe Payments',
  smtp: 'Email (SMTP)',
  oauth_google: 'Google OAuth',
  oauth_github: 'GitHub OAuth',
};

/**
 * Field metadata for UI forms
 */
export interface FieldMeta {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
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
