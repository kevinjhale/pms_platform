'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardCard as DashboardCardType } from '@/db/schema/dashboard';
import type { DashboardData } from '@/services/dashboard';
import { CARD_TYPE_DEFINITIONS } from '@/lib/dashboard/cardTypes';
import { renderCardContent } from './cards';

interface DashboardCardProps {
  card: DashboardCardType;
  data: DashboardData;
  isEditing: boolean;
  isDragging?: boolean;
  onRemove?: () => void;
  onResize?: (size: { colSpan: number; rowSpan: number }) => void;
}

export function DashboardCard({
  card,
  data,
  isEditing,
  isDragging = false,
  onRemove,
  onResize,
}: DashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id, disabled: !isEditing });

  const definition = CARD_TYPE_DEFINITIONS[card.type];
  const { colSpan, rowSpan } = card.position;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  if (isEditing) {
    style.outline = '2px dashed var(--primary)';
    style.outlineOffset = '-2px';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditing ? { ...attributes, ...listeners } : {})}
    >
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: isEditing ? 'var(--primary-light, rgba(59, 130, 246, 0.05))' : 'transparent',
          cursor: isEditing ? 'grab' : 'default',
          minHeight: '44px',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {card.config?.title || definition.label}
        </span>

        {isEditing && (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {/* Width controls */}
            {colSpan > definition.minSize.colSpan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResize?.({ colSpan: colSpan - 1, rowSpan });
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface)',
                  cursor: 'pointer',
                }}
                title="Decrease width"
              >
                -W
              </button>
            )}
            {colSpan < definition.maxSize.colSpan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResize?.({ colSpan: colSpan + 1, rowSpan });
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface)',
                  cursor: 'pointer',
                }}
                title="Increase width"
              >
                +W
              </button>
            )}

            {/* Height controls */}
            {rowSpan > definition.minSize.rowSpan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResize?.({ colSpan, rowSpan: rowSpan - 1 });
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface)',
                  cursor: 'pointer',
                }}
                title="Decrease height"
              >
                -H
              </button>
            )}
            {rowSpan < definition.maxSize.rowSpan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResize?.({ colSpan, rowSpan: rowSpan + 1 });
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface)',
                  cursor: 'pointer',
                }}
                title="Increase height"
              >
                +H
              </button>
            )}

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.625rem',
                border: '1px solid #dc2626',
                borderRadius: '4px',
                backgroundColor: 'var(--surface)',
                color: '#dc2626',
                cursor: 'pointer',
                marginLeft: '0.25rem',
              }}
              title="Remove card"
            >
              X
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '1rem', flex: 1, overflow: 'auto' }}>
        {renderCardContent(card, data)}
      </div>
    </div>
  );
}
