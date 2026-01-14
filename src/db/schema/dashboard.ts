import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Dashboard configurations are per-user
// Each user can customize their own layout
export const dashboardConfigs = sqliteTable('dashboard_configs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // JSON array of card configurations
  cards: text('cards', { mode: 'json' }).$type<DashboardCard[]>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Card position in grid
export interface CardPosition {
  col: number;      // 1-based column start
  row: number;      // 1-based row start
  colSpan: number;  // Width in columns (1-4)
  rowSpan: number;  // Height in rows (1-3)
}

// Card-specific configuration (phase 3 features included for future)
export interface CardConfig {
  limit?: number;           // For list cards: how many items
  propertyId?: string;      // Filter to specific property
  timeRange?: 'current_month' | 'last_30_days' | 'last_90_days' | 'last_6_months' | 'ytd' | 'custom';
  startDate?: string;       // ISO date for custom range
  endDate?: string;         // ISO date for custom range
  title?: string;           // Custom title override
}

// All supported card types
export type DashboardCardType =
  // Metrics (single stat)
  | 'occupancy_rate'
  | 'total_units'
  | 'total_revenue'
  | 'collection_rate'
  | 'open_maintenance'
  | 'pending_applications'
  | 'expiring_leases_30'
  | 'expiring_leases_90'
  | 'outstanding_balance'
  // Charts
  | 'revenue_chart'
  | 'occupancy_chart'
  | 'payment_status_chart'
  | 'maintenance_category_chart'
  // Lists
  | 'recent_maintenance'
  | 'upcoming_lease_expirations'
  | 'overdue_payments'
  | 'recent_applications'
  | 'properties_list'
  | 'vacant_units'
  // Actions
  | 'quick_actions';

// Single dashboard card
export interface DashboardCard {
  id: string;
  type: DashboardCardType;
  position: CardPosition;
  config?: CardConfig;
}

export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type NewDashboardConfig = typeof dashboardConfigs.$inferInsert;
