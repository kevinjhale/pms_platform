import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations';
import { users } from './users';

export const documentEntityTypes = [
  'maintenance_request',
  'application',
  'lease',
  'property',
  'unit',
  'user',
] as const;

export const documentTypes = [
  // Maintenance
  'maintenance_photo',
  'maintenance_before',
  'maintenance_after',
  // Applications
  'id_document',
  'pay_stub',
  'bank_statement',
  'tax_return',
  'reference_letter',
  // Leases
  'lease_agreement',
  'addendum',
  'signed_document',
  // Property
  'property_photo',
  'floor_plan',
  'inspection_report',
  // General
  'other',
] as const;

export const storageProviders = ['local', 's3', 'r2', 'do_spaces'] as const;

export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // What this document is attached to
    entityType: text('entity_type', { enum: documentEntityTypes }).notNull(),
    entityId: text('entity_id').notNull(),

    // Document categorization
    documentType: text('document_type', { enum: documentTypes }).notNull(),

    // File info
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),

    // Storage info
    storageProvider: text('storage_provider', { enum: storageProviders }).notNull(),
    storageKey: text('storage_key').notNull(),
    storageBucket: text('storage_bucket'),

    // Access control
    isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),

    // Metadata
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    description: text('description'),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('documents_org_idx').on(table.organizationId),
    index('documents_entity_idx').on(table.entityType, table.entityId),
    index('documents_type_idx').on(table.documentType),
  ]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentEntityType = (typeof documentEntityTypes)[number];
export type DocumentType = (typeof documentTypes)[number];
export type StorageProviderType = (typeof storageProviders)[number];
