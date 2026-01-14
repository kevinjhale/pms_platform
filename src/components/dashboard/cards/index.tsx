import type { DashboardCard } from '@/db/schema/dashboard';
import type { DashboardData } from '@/services/dashboard';
import { MetricCard } from './MetricCard';
import {
  RevenueChartCard,
  OccupancyChartCard,
  PaymentStatusChartCard,
  MaintenanceCategoryChartCard,
} from './ChartCards';
import {
  RecentMaintenanceCard,
  UpcomingLeasesCard,
  OverduePaymentsCard,
  RecentApplicationsCard,
  PropertiesListCard,
  VacantUnitsCard,
} from './ListCards';
import { QuickActionsCard } from './QuickActionsCard';

export function renderCardContent(card: DashboardCard, data: DashboardData) {
  switch (card.type) {
    // === Metric cards ===
    case 'occupancy_rate':
      return (
        <MetricCard
          value={`${data.occupancy.occupancyRate}%`}
          label="Occupancy Rate"
          color="#3b82f6"
        />
      );

    case 'total_units':
      return (
        <MetricCard
          value={data.occupancy.totalUnits}
          label="Total Units"
          subtitle={`${data.occupancy.occupiedUnits} occupied`}
        />
      );

    case 'total_revenue':
      return (
        <MetricCard
          value={`$${(data.revenue.collectedThisMonth / 100).toLocaleString()}`}
          label="Collected This Month"
          color="#22c55e"
        />
      );

    case 'collection_rate':
      return (
        <MetricCard
          value={`${data.revenue.collectionRate}%`}
          label="Collection Rate"
          color={data.revenue.collectionRate >= 90 ? '#22c55e' : data.revenue.collectionRate >= 70 ? '#f59e0b' : '#ef4444'}
        />
      );

    case 'open_maintenance':
      return (
        <MetricCard
          value={data.maintenance.openRequests}
          label="Open Requests"
          color={data.maintenance.openRequests > 5 ? '#ef4444' : '#f59e0b'}
          subtitle={`${data.maintenance.inProgressRequests} in progress`}
        />
      );

    case 'pending_applications':
      return (
        <MetricCard
          value={data.applications.pendingApplications}
          label="Pending Applications"
          color="#f59e0b"
        />
      );

    case 'expiring_leases_30':
      return (
        <MetricCard
          value={data.leases.expiringIn30Days}
          label="Expiring (30 days)"
          color={data.leases.expiringIn30Days > 0 ? '#ef4444' : '#22c55e'}
        />
      );

    case 'expiring_leases_90':
      return (
        <MetricCard
          value={data.leases.expiringIn90Days}
          label="Expiring (90 days)"
          color={data.leases.expiringIn90Days > 3 ? '#f59e0b' : '#22c55e'}
        />
      );

    case 'outstanding_balance':
      return (
        <MetricCard
          value={`$${(data.revenue.outstandingBalance / 100).toLocaleString()}`}
          label="Outstanding Balance"
          color={data.revenue.outstandingBalance > 0 ? '#ef4444' : '#22c55e'}
        />
      );

    // === Chart cards ===
    case 'revenue_chart':
      return <RevenueChartCard data={data.revenueHistory} />;

    case 'occupancy_chart':
      return <OccupancyChartCard data={data.occupancy} />;

    case 'payment_status_chart':
      return <PaymentStatusChartCard data={data.paymentStatusCounts} />;

    case 'maintenance_category_chart':
      return <MaintenanceCategoryChartCard data={data.maintenance.byCategory} />;

    // === List cards ===
    case 'recent_maintenance':
      return <RecentMaintenanceCard requests={data.recentMaintenance} limit={card.config?.limit} />;

    case 'upcoming_lease_expirations':
      return <UpcomingLeasesCard leases={data.leases.upcomingExpirations} limit={card.config?.limit} />;

    case 'overdue_payments':
      return <OverduePaymentsCard payments={data.overduePayments} limit={card.config?.limit} />;

    case 'recent_applications':
      return <RecentApplicationsCard applications={data.recentApplications} limit={card.config?.limit} />;

    case 'properties_list':
      return <PropertiesListCard properties={data.properties} />;

    case 'vacant_units':
      return <VacantUnitsCard units={data.vacantUnits} />;

    // === Action cards ===
    case 'quick_actions':
      return <QuickActionsCard />;

    default:
      return <div style={{ color: 'var(--secondary)' }}>Unknown card type</div>;
  }
}
