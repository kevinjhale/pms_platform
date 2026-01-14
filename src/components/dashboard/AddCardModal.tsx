'use client';

import { useEffect, useCallback } from 'react';
import type { DashboardCardType } from '@/db/schema/dashboard';
import { CARD_TYPE_DEFINITIONS, CARD_CATEGORIES, getCardTypesByCategory } from '@/lib/dashboard/cardTypes';

interface AddCardModalProps {
  onAdd: (type: DashboardCardType) => void;
  onClose: () => void;
  existingCardTypes: DashboardCardType[];
}

export function AddCardModal({ onAdd, onClose, existingCardTypes }: AddCardModalProps) {
  // Handle escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const categories = ['metric', 'chart', 'list', 'action'] as const;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Add Card</h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--secondary)',
            }}
          >
            ×
          </button>
        </div>

        {categories.map((category) => {
          const categoryInfo = CARD_CATEGORIES[category];
          const cardTypes = getCardTypesByCategory(category);

          return (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                {categoryInfo.label}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                {categoryInfo.description}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {cardTypes.map((def) => {
                  const isAdded = existingCardTypes.includes(def.type);

                  return (
                    <button
                      key={def.type}
                      onClick={() => !isAdded && onAdd(def.type)}
                      disabled={isAdded}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: isAdded ? 'var(--surface)' : 'var(--background)',
                        cursor: isAdded ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        opacity: isAdded ? 0.5 : 1,
                        transition: 'background-color 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isAdded) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = isAdded ? 'var(--surface)' : 'var(--background)';
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {def.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        {isAdded ? 'Already added' : def.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
