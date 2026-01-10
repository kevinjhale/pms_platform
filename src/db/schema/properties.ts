import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations';
import { users } from './users';

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  landlordId: text('landlord_id').references(() => users.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  country: text('country').notNull().default('US'),
  apn: text('apn'), // Assessor's Parcel Number
  // Utility jurisdiction info - which company/district handles each utility
  utilityWater: text('utility_water'),
  utilityTrash: text('utility_trash'),
  utilityElectricity: text('utility_electricity'),
  propertyType: text('property_type', {
    enum: ['single_family', 'multi_family', 'condo', 'apartment', 'townhouse', 'other']
  }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  yearBuilt: integer('year_built'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  unitNumber: text('unit_number'),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: real('bathrooms').notNull(),
  sqft: integer('sqft'),
  rentAmount: integer('rent_amount').notNull(), // stored in cents
  depositAmount: integer('deposit_amount'), // stored in cents
  status: text('status', { enum: ['available', 'occupied', 'maintenance', 'unlisted'] }).notNull().default('unlisted'),
  availableDate: integer('available_date', { mode: 'timestamp' }),
  listedDate: integer('listed_date', { mode: 'timestamp' }), // When unit was first listed
  features: text('features', { mode: 'json' }).$type<string[]>(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const propertyManagers = sqliteTable('property_managers', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  splitPercentage: integer('split_percentage').notNull(), // PM's percentage (0-100)
  status: text('status', { enum: ['proposed', 'accepted', 'rejected'] }).notNull().default('proposed'),
  proposedBy: text('proposed_by').notNull().references(() => users.id),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const unitPhotos = sqliteTable('unit_photos', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
export type PropertyManager = typeof propertyManagers.$inferSelect;
export type NewPropertyManager = typeof propertyManagers.$inferInsert;
