'use client';

import { useState, useTransition, useRef } from 'react';
import type { DashboardCard } from '@/db/schema/dashboard';
import type { DashboardData } from '@/services/dashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

interface DashboardContentProps {
  initialCards: DashboardCard[];
  data: DashboardData;
  organizationName: string;
}

export function DashboardContent({ initialCards, data, organizationName }: DashboardContentProps) {
  const [cards, setCards] = useState(initialCards);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedCardsRef = useRef(initialCards);

  const handleCardsChange = (newCards: DashboardCard[]) => {
    setCards(newCards);
    setHasUnsavedChanges(true);
    setSaveError(null);
  };

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/dashboard/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards }),
        });

        if (response.ok) {
          savedCardsRef.current = cards;
          setHasUnsavedChanges(false);
          setIsEditing(false);
          setSaveError(null);
        } else {
          const error = await response.json();
          setSaveError(error.error || 'Failed to save dashboard');
        }
      } catch {
        setSaveError('Network error - please try again');
      }
    });
  };

  const handleCancel = () => {
    setCards(savedCardsRef.current);
    setHasUnsavedChanges(false);
    setIsEditing(false);
    setSaveError(null);
  };

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--secondary)', margin: '0.25rem 0 0 0' }}>{organizationName}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="btn"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={isPending || !hasUnsavedChanges}
              >
                {isPending ? 'Saving...' : 'Save Layout'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn"
              style={{ border: '1px solid var(--border)' }}
            >
              Customize Dashboard
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          {saveError}
        </div>
      )}

      {isEditing && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef3c7',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#92400e',
          }}
        >
          Drag cards to reorder. Click + Add Card to add new cards. Use +W/-W and +H/-H to resize. Click X to remove.
        </div>
      )}

      <DashboardGrid
        cards={cards}
        data={data}
        onCardsChange={handleCardsChange}
        isEditing={isEditing}
      />
    </main>
  );
}
