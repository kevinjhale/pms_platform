import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations';

/**
 * Integration settings table for storing per-organization third-party credentials
 * Sensitive values are encrypted using AES-256-GCM
 */
export const integrationSettings = sqliteTable(
  'integration_settings',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Which integration this setting belongs to
    integrationKey: text('integration_key', {
      enum: ['stripe', 'smtp', 'oauth_google', 'oauth_github', 'storage'],
    }).notNull(),

    // Setting key within the integration (e.g., 'secretKey', 'host')
    settingKey: text('setting_key').notNull(),

    // Encrypted or plain value
    value: text('value').notNull(),

    // Whether this value is encrypted
    isEncrypted: integer('is_encrypted', { mode: 'boolean' }).notNull().default(false),

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    // Ensure unique combination of org + integration + setting key
    uniqueIndex('integration_settings_unique_idx').on(
      table.organizationId,
      table.integrationKey,
      table.settingKey
    ),
  ]
);

export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type NewIntegrationSetting = typeof integrationSettings.$inferInsert;
