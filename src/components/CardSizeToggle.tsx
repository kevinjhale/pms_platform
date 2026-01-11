'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type CardSize = 'compact' | 'normal';

interface CardSizeContextType {
  size: CardSize;
  setSize: (size: CardSize) => void;
}

const CardSizeContext = createContext<CardSizeContextType | null>(null);

const STORAGE_KEY = 'reports-card-size';

export function CardSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<CardSize>('normal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as CardSize | null;
    if (stored === 'compact' || stored === 'normal') {
      setSize(stored);
    }
  }, []);

  const handleSetSize = (newSize: CardSize) => {
    setSize(newSize);
    localStorage.setItem(STORAGE_KEY, newSize);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <CardSizeContext.Provider value={{ size, setSize: handleSetSize }}>
      {children}
    </CardSizeContext.Provider>
  );
}

export function useCardSize() {
  const context = useContext(CardSizeContext);
  if (!context) {
    return { size: 'normal' as CardSize, setSize: () => {} };
  }
  return context;
}

export function CardSizeToggle() {
  const { size, setSize } = useCardSize();

  return (
    <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.25rem', border: '1px solid var(--border)' }}>
      <button
        onClick={() => setSize('compact')}
        style={{
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          border: 'none',
          borderRadius: 'calc(var(--radius) - 2px)',
          cursor: 'pointer',
          backgroundColor: size === 'compact' ? 'var(--primary)' : 'transparent',
          color: size === 'compact' ? 'white' : 'var(--secondary)',
          transition: 'all 0.15s ease',
        }}
        title="Compact cards"
      >
        Compact
      </button>
      <button
        onClick={() => setSize('normal')}
        style={{
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          border: 'none',
          borderRadius: 'calc(var(--radius) - 2px)',
          cursor: 'pointer',
          backgroundColor: size === 'normal' ? 'var(--primary)' : 'transparent',
          color: size === 'normal' ? 'white' : 'var(--secondary)',
          transition: 'all 0.15s ease',
        }}
        title="Normal cards"
      >
        Normal
      </button>
    </div>
  );
}
