'use client';

import Link from 'next/link';
import type {
  RecentMaintenance,
  RecentApplication,
  OverduePayment,
  VacantUnit,
} from '@/services/dashboard';
import type { PropertyWithUnitCount } from '@/services/properties';
import type { LeaseMetrics } from '@/services/reports';

const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  acknowledged: '#f59e0b',
  in_progress: '#3b82f6',
  pending_parts: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#6b7280',
  submitted: '#f59e0b',
  under_review: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626',
};

// ============ RECENT MAINTENANCE ============

interface RecentMaintenanceCardProps {
  requests: RecentMaintenance[];
  limit?: number;
}

export function RecentMaintenanceCard({ requests, limit = 5 }: RecentMaintenanceCardProps) {
  const items = requests.slice(0, limit);

  if (items.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No maintenance requests</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((req) => (
        <Link
          key={req.id}
          href={`/landlord/maintenance/${req.id}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {req.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {req.propertyName} {req.unitNumber ? `#${req.unitNumber}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
            <span
              style={{
                padding: '0.125rem 0.375rem',
                fontSize: '0.625rem',
                borderRadius: '4px',
                backgroundColor: PRIORITY_COLORS[req.priority] || '#6b7280',
                color: 'white',
                textTransform: 'uppercase',
              }}
            >
              {req.priority}
            </span>
            <span
              style={{
                padding: '0.125rem 0.375rem',
                fontSize: '0.625rem',
                borderRadius: '4px',
                backgroundColor: STATUS_COLORS[req.status] || '#6b7280',
                color: 'white',
                textTransform: 'uppercase',
              }}
            >
              {req.status.replace(/_/g, ' ')}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============ UPCOMING LEASE EXPIRATIONS ============

interface UpcomingLeasesCardProps {
  leases: LeaseMetrics['upcomingExpirations'];
  limit?: number;
}

export function UpcomingLeasesCard({ leases, limit = 5 }: UpcomingLeasesCardProps) {
  const items = leases.slice(0, limit);

  if (items.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No upcoming expirations</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((lease) => (
        <Link
          key={lease.leaseId}
          href={`/landlord/leases/${lease.leaseId}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {lease.tenantName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {lease.propertyName} {lease.unitNumber ? `#${lease.unitNumber}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginLeft: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: lease.daysUntilExpiry <= 14 ? '#ef4444' : lease.daysUntilExpiry <= 30 ? '#f59e0b' : 'var(--foreground)',
              }}
            >
              {lease.daysUntilExpiry} days
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {new Date(lease.endDate).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============ OVERDUE PAYMENTS ============

interface OverduePaymentsCardProps {
  payments: OverduePayment[];
  limit?: number;
}

export function OverduePaymentsCard({ payments, limit = 5 }: OverduePaymentsCardProps) {
  const items = payments.slice(0, limit);

  if (items.length === 0) {
    return <div style={{ color: '#22c55e', textAlign: 'center' }}>No overdue payments</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((payment, idx) => (
        <div
          key={`${payment.leaseId}-${idx}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {payment.tenantName || payment.tenantEmail}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {payment.propertyName} {payment.unitNumber ? `#${payment.unitNumber}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginLeft: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>
              ${((payment.amountDue - payment.amountPaid) / 100).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              Due {new Date(payment.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ RECENT APPLICATIONS ============

interface RecentApplicationsCardProps {
  applications: RecentApplication[];
  limit?: number;
}

export function RecentApplicationsCard({ applications, limit = 5 }: RecentApplicationsCardProps) {
  const items = applications.slice(0, limit);

  if (items.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No recent applications</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((app) => (
        <Link
          key={app.id}
          href={`/landlord/applications/${app.id}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {app.applicantName || app.applicantEmail}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {app.propertyName} {app.unitNumber ? `#${app.unitNumber}` : ''}
            </div>
          </div>
          <span
            style={{
              padding: '0.125rem 0.375rem',
              fontSize: '0.625rem',
              borderRadius: '4px',
              backgroundColor: STATUS_COLORS[app.status] || '#6b7280',
              color: 'white',
              textTransform: 'uppercase',
              marginLeft: '0.5rem',
            }}
          >
            {app.status.replace(/_/g, ' ')}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ============ PROPERTIES LIST ============

interface PropertiesListCardProps {
  properties: PropertyWithUnitCount[];
}

export function PropertiesListCard({ properties }: PropertiesListCardProps) {
  if (!properties || properties.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No properties</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {properties.slice(0, 10).map((property) => (
        <Link
          key={property.id}
          href={`/landlord/properties/${property.id}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {property.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {property.address}, {property.city}
            </div>
          </div>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '4px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              marginLeft: '0.5rem',
            }}
          >
            {property.unitCount} units
          </span>
        </Link>
      ))}
    </div>
  );
}

// ============ VACANT UNITS ============

interface VacantUnitsCardProps {
  units: VacantUnit[];
}

export function VacantUnitsCard({ units }: VacantUnitsCardProps) {
  if (!units || units.length === 0) {
    return <div style={{ color: '#22c55e', textAlign: 'center' }}>No vacant units</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {units.slice(0, 10).map((unit) => (
        <Link
          key={unit.unitId}
          href={`/landlord/properties/${unit.propertyId}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {unit.propertyName} {unit.unitNumber ? `#${unit.unitNumber}` : ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              {unit.bedrooms ?? '-'} bed · {unit.bathrooms ?? '-'} bath
            </div>
          </div>
          {unit.monthlyRent && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, marginLeft: '0.5rem' }}>
              ${(unit.monthlyRent / 100).toLocaleString()}/mo
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
