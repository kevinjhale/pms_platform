import type { DashboardCardType } from '@/db/schema/dashboard';

// Data requirements for efficient fetching
export type DataRequirement =
  | 'occupancy'
  | 'revenue'
  | 'maintenance'
  | 'leases'
  | 'applications'
  | 'properties'
  | 'revenueHistory'
  | 'rentRoll';

// Metadata for each card type
export interface CardTypeDefinition {
  type: DashboardCardType;
  label: string;
  description: string;
  category: 'metric' | 'chart' | 'list' | 'action';
  defaultSize: { colSpan: number; rowSpan: number };
  minSize: { colSpan: number; rowSpan: number };
  maxSize: { colSpan: number; rowSpan: number };
  dataRequirements: DataRequirement[];
  configurable?: boolean;
}

export const CARD_TYPE_DEFINITIONS: Record<DashboardCardType, CardTypeDefinition> = {
  // === METRIC CARDS ===
  occupancy_rate: {
    type: 'occupancy_rate',
    label: 'Occupancy Rate',
    description: 'Current portfolio occupancy percentage',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['occupancy'],
  },
  total_units: {
    type: 'total_units',
    label: 'Total Units',
    description: 'Total number of units in portfolio',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['occupancy'],
  },
  total_revenue: {
    type: 'total_revenue',
    label: 'Monthly Revenue',
    description: 'Total revenue collected this month',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['revenue'],
  },
  collection_rate: {
    type: 'collection_rate',
    label: 'Collection Rate',
    description: 'Percentage of rent collected vs expected',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['revenue'],
  },
  open_maintenance: {
    type: 'open_maintenance',
    label: 'Open Maintenance',
    description: 'Number of open maintenance requests',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['maintenance'],
  },
  pending_applications: {
    type: 'pending_applications',
    label: 'Pending Applications',
    description: 'Applications awaiting review',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['applications'],
  },
  expiring_leases_30: {
    type: 'expiring_leases_30',
    label: 'Expiring (30 days)',
    description: 'Leases expiring in next 30 days',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['leases'],
  },
  expiring_leases_90: {
    type: 'expiring_leases_90',
    label: 'Expiring (90 days)',
    description: 'Leases expiring in next 90 days',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['leases'],
  },
  outstanding_balance: {
    type: 'outstanding_balance',
    label: 'Outstanding Balance',
    description: 'Total unpaid rent balance',
    category: 'metric',
    defaultSize: { colSpan: 1, rowSpan: 1 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 1 },
    dataRequirements: ['revenue'],
  },

  // === CHART CARDS ===
  revenue_chart: {
    type: 'revenue_chart',
    label: 'Revenue Trend',
    description: 'Monthly revenue chart',
    category: 'chart',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 2, rowSpan: 2 },
    maxSize: { colSpan: 4, rowSpan: 2 },
    dataRequirements: ['revenueHistory'],
    configurable: true,
  },
  occupancy_chart: {
    type: 'occupancy_chart',
    label: 'Occupancy Chart',
    description: 'Occupied vs vacant units',
    category: 'chart',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 2 },
    dataRequirements: ['occupancy'],
  },
  payment_status_chart: {
    type: 'payment_status_chart',
    label: 'Payment Status',
    description: 'Payment status distribution',
    category: 'chart',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 2 },
    dataRequirements: ['rentRoll'],
  },
  maintenance_category_chart: {
    type: 'maintenance_category_chart',
    label: 'Maintenance by Category',
    description: 'Open requests by category',
    category: 'chart',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 2 },
    dataRequirements: ['maintenance'],
  },

  // === LIST CARDS ===
  recent_maintenance: {
    type: 'recent_maintenance',
    label: 'Recent Maintenance',
    description: 'Latest maintenance requests',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['maintenance'],
    configurable: true,
  },
  upcoming_lease_expirations: {
    type: 'upcoming_lease_expirations',
    label: 'Upcoming Expirations',
    description: 'Leases expiring soon',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['leases'],
    configurable: true,
  },
  overdue_payments: {
    type: 'overdue_payments',
    label: 'Overdue Payments',
    description: 'Payments past due date',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['rentRoll'],
    configurable: true,
  },
  recent_applications: {
    type: 'recent_applications',
    label: 'Recent Applications',
    description: 'Latest rental applications',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['applications'],
    configurable: true,
  },
  properties_list: {
    type: 'properties_list',
    label: 'Properties',
    description: 'List of properties with unit counts',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['properties'],
  },
  vacant_units: {
    type: 'vacant_units',
    label: 'Vacant Units',
    description: 'Currently vacant units',
    category: 'list',
    defaultSize: { colSpan: 2, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 2 },
    maxSize: { colSpan: 2, rowSpan: 3 },
    dataRequirements: ['properties'],
  },

  // === ACTION CARDS ===
  quick_actions: {
    type: 'quick_actions',
    label: 'Quick Actions',
    description: 'Common actions shortcuts',
    category: 'action',
    defaultSize: { colSpan: 1, rowSpan: 2 },
    minSize: { colSpan: 1, rowSpan: 1 },
    maxSize: { colSpan: 2, rowSpan: 2 },
    dataRequirements: [],
  },
};

// Group card types by category for the add card modal
export const CARD_CATEGORIES = {
  metric: {
    label: 'Key Metrics',
    description: 'Single stat cards showing important numbers',
  },
  chart: {
    label: 'Charts',
    description: 'Visual charts and graphs',
  },
  list: {
    label: 'Lists',
    description: 'Lists of items with details',
  },
  action: {
    label: 'Actions',
    description: 'Quick action shortcuts',
  },
} as const;

// Get card types by category
export function getCardTypesByCategory(category: keyof typeof CARD_CATEGORIES): CardTypeDefinition[] {
  return Object.values(CARD_TYPE_DEFINITIONS).filter(def => def.category === category);
}
