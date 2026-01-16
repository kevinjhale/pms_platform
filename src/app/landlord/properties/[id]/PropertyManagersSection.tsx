'use client';

import { useState } from 'react';
import { AssignManagerModal } from './AssignManagerModal';

interface PropertyManagerWithUser {
  assignment: {
    id: string;
    propertyId: string;
    userId: string;
    splitPercentage: number;
    status: 'proposed' | 'accepted' | 'rejected';
    proposedBy: string;
    acceptedAt: Date | null;
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface OrgMember {
  member: {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface PropertyManagersSectionProps {
  propertyId: string;
  managers: PropertyManagerWithUser[];
  orgMembers: OrgMember[];
  canAssign: boolean;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  proposed: { bg: '#fef3c7', text: '#92400e' },
  accepted: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
};

export function PropertyManagersSection({
  propertyId,
  managers,
  orgMembers,
  canAssign,
}: PropertyManagersSectionProps) {
  const [showModal, setShowModal] = useState(false);

  // Filter out users already assigned to this property
  const assignedUserIds = new Set(managers.map((m) => m.user.id));
  const eligibleMembers = orgMembers.filter((m) => !assignedUserIds.has(m.user.id));

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          Property Managers
        </h2>
        {canAssign && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Assign Manager
          </button>
        )}
      </div>

      {managers.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ color: 'var(--secondary)', margin: 0 }}>
            No property managers assigned yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {managers.map(({ assignment, user }) => {
            const statusStyle = statusColors[assignment.status] || statusColors.proposed;
            return (
              <div
                key={assignment.id}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{user.name || user.email}</div>
                  {user.name && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                      {user.email}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {assignment.splitPercentage}%
                  </span>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {assignment.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AssignManagerModal
          propertyId={propertyId}
          members={eligibleMembers}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
