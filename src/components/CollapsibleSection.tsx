'use client';

import { useState, useEffect, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  isCompact?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  storageKey,
  isCompact = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setIsOpen(stored === 'true');
      }
    }
  }, [storageKey]);

  const toggle = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    if (storageKey) {
      localStorage.setItem(storageKey, String(newValue));
    }
  };

  // Prevent hydration mismatch
  const showOpen = mounted ? isOpen : defaultOpen;

  return (
    <section style={{ marginBottom: isCompact ? '1rem' : '1.5rem' }}>
      <button
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: isCompact ? '0.5rem 0' : '0.75rem 0',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: showOpen ? (isCompact ? '0.5rem' : '1rem') : 0,
        }}
        aria-expanded={showOpen}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--secondary)',
            transition: 'transform 0.2s ease',
            transform: showOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </span>
        <h2
          style={{
            fontSize: isCompact ? '1rem' : '1.25rem',
            fontWeight: '600',
            margin: 0,
            flex: 1,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--secondary)',
            padding: '0.125rem 0.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
          }}
        >
          {showOpen ? 'collapse' : 'expand'}
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: showOpen ? '10000px' : '0',
          opacity: showOpen ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        {children}
      </div>
    </section>
  );
}
