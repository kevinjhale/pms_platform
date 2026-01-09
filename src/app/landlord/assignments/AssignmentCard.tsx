'use client';

import { useState } from 'react';
import type { Property, PropertyManager } from '@/db';
import { respondToAssignment } from './actions';

interface AssignmentCardProps {
  assignment: PropertyManager;
  property: Property;
}

export default function AssignmentCard({ assignment, property }: AssignmentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<'accepted' | 'rejected' | null>(null);

  const handleResponse = async (accept: boolean) => {
    setIsLoading(true);
    try {
      const result = await respondToAssignment(assignment.id, accept);
      if (result.success) {
        setResponse(accept ? 'accepted' : 'rejected');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (response) {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: response === 'accepted' ? '#dcfce7' : '#fef2f2',
        border: `1px solid ${response === 'accepted' ? '#86efac' : '#fecaca'}`,
        borderRadius: '12px',
      }}>
        <p style={{
          color: response === 'accepted' ? '#166534' : '#991b1b',
          fontWeight: 500,
        }}>
          {response === 'accepted'
            ? `You accepted the assignment for ${property.name}`
            : `You declined the assignment for ${property.name}`}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>{property.name}</h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {property.address}<br />
            {property.city}, {property.state} {property.zip}
          </p>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.75rem',
          }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--border)',
              borderRadius: '999px',
              fontSize: '0.875rem',
            }}>
              {property.propertyType.replace('_', ' ')}
            </span>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {assignment.splitPercentage}% commission
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}>
          <button
            onClick={() => handleResponse(false)}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Decline
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Processing...' : 'Accept'}
          </button>
        </div>
      </div>

      {assignment.createdAt && (
        <p style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--secondary)',
        }}>
          Proposed on {new Date(assignment.createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
