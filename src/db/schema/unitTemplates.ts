import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations';

export const unitTemplates = sqliteTable('unit_templates', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: real('bathrooms').notNull(),
  sqft: integer('sqft'),
  rentAmount: integer('rent_amount').notNull(),
  depositAmount: integer('deposit_amount'),
  features: text('features', { mode: 'json' }).$type<string[]>(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type UnitTemplate = typeof unitTemplates.$inferSelect;
export type NewUnitTemplate = typeof unitTemplates.$inferInsert;
