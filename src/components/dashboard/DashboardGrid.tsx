'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { DashboardCard as DashboardCardType } from '@/db/schema/dashboard';
import type { DashboardData } from '@/services/dashboard';
import { DashboardCard } from './DashboardCard';
import { AddCardModal } from './AddCardModal';
import { CARD_TYPE_DEFINITIONS } from '@/lib/dashboard/cardTypes';

interface DashboardGridProps {
  cards: DashboardCardType[];
  data: DashboardData;
  onCardsChange: (cards: DashboardCardType[]) => void;
  isEditing: boolean;
}

const GRID_COLUMNS = 4;

export function DashboardGrid({ cards, data, onCardsChange, isEditing }: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeIndex = cards.findIndex(c => c.id === active.id);
    const overIndex = cards.findIndex(c => c.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    const newCards = [...cards];
    const [removed] = newCards.splice(activeIndex, 1);
    newCards.splice(overIndex, 0, removed);

    // Recalculate positions after reorder
    const repositioned = recalculatePositions(newCards);
    onCardsChange(repositioned);
  };

  const handleAddCard = (type: DashboardCardType['type']) => {
    const definition = CARD_TYPE_DEFINITIONS[type];
    const newCard: DashboardCardType = {
      id: `card-${Date.now()}`,
      type,
      position: findNextAvailablePosition(cards, definition.defaultSize),
      config: {},
    };
    onCardsChange([...cards, newCard]);
    setShowAddModal(false);
  };

  const handleRemoveCard = (cardId: string) => {
    const newCards = cards.filter(c => c.id !== cardId);
    onCardsChange(recalculatePositions(newCards));
  };

  const handleResizeCard = (cardId: string, newSize: { colSpan: number; rowSpan: number }) => {
    const newCards = cards.map(c =>
      c.id === cardId
        ? { ...c, position: { ...c.position, ...newSize } }
        : c
    );
    onCardsChange(recalculatePositions(newCards));
  };

  const activeCard = cards.find(c => c.id === activeId);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gap: '1rem',
            padding: '1rem 0',
          }}
        >
          <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
            {cards.map((card) => (
              <DashboardCard
                key={card.id}
                card={card}
                data={data}
                isEditing={isEditing}
                onRemove={() => handleRemoveCard(card.id)}
                onResize={(size) => handleResizeCard(card.id, size)}
              />
            ))}
          </SortableContext>

          {isEditing && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                gridColumn: 'span 1',
                minHeight: '150px',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              + Add Card
            </button>
          )}
        </div>

        <DragOverlay>
          {activeCard && (
            <DashboardCard
              card={activeCard}
              data={data}
              isEditing={false}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {showAddModal && (
        <AddCardModal
          onAdd={handleAddCard}
          onClose={() => setShowAddModal(false)}
          existingCardTypes={cards.map(c => c.type)}
        />
      )}
    </>
  );
}

// Helper: find next available position in grid
function findNextAvailablePosition(
  cards: DashboardCardType[],
  size: { colSpan: number; rowSpan: number }
): DashboardCardType['position'] {
  const maxRow = cards.reduce((max, c) =>
    Math.max(max, c.position.row + c.position.rowSpan), 1
  );

  return {
    col: 1,
    row: maxRow,
    ...size,
  };
}

// Helper: recalculate positions after reorder (auto-flow)
function recalculatePositions(cards: DashboardCardType[]): DashboardCardType[] {
  const COLS = 4;
  let currentRow = 1;
  let currentCol = 1;
  let rowHeight = 1;

  return cards.map(card => {
    const { colSpan, rowSpan } = card.position;

    // If card doesn't fit in current row, move to next
    if (currentCol + colSpan - 1 > COLS) {
      currentRow += rowHeight;
      currentCol = 1;
      rowHeight = 1;
    }

    const newCard = {
      ...card,
      position: {
        col: currentCol,
        row: currentRow,
        colSpan,
        rowSpan,
      },
    };

    currentCol += colSpan;
    rowHeight = Math.max(rowHeight, rowSpan);

    return newCard;
  });
}
