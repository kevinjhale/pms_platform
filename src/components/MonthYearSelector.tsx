'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface MonthYearSelectorProps {
  currentMonth: number;
  currentYear: number;
  isCompact?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearSelector({ currentMonth, currentYear, isCompact = false }: MonthYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Generate available years (past 2 years to current)
  const now = new Date();
  const years: number[] = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear(); y++) {
    years.push(y);
  }

  const handleChange = useCallback((month: number, year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', String(month));
    params.set('year', String(year));
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handlePrev = useCallback(() => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }
    // Don't go before 2 years ago
    const minYear = now.getFullYear() - 2;
    if (newYear >= minYear) {
      handleChange(newMonth, newYear);
    }
  }, [currentMonth, currentYear, handleChange]);

  const handleNext = useCallback(() => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }
    // Don't go beyond current month
    const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const selectedDate = new Date(newYear, newMonth - 1, 1);
    if (selectedDate <= maxDate) {
      handleChange(newMonth, newYear);
    }
  }, [currentMonth, currentYear, handleChange]);

  const handleReset = useCallback(() => {
    router.push('?');
  }, [router]);

  // Check if we're at the current month
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  // Check boundaries
  const minYear = now.getFullYear() - 2;
  const canGoPrev = currentYear > minYear || currentMonth > 1;
  const canGoNext = !isCurrentMonth;

  const selectStyle = {
    padding: isCompact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
    fontSize: isCompact ? '0.75rem' : '0.875rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    cursor: 'pointer',
    outline: 'none',
  };

  const buttonStyle = {
    padding: isCompact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
    fontSize: isCompact ? '0.875rem' : '1rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        style={{
          ...buttonStyle,
          opacity: canGoPrev ? 1 : 0.4,
          cursor: canGoPrev ? 'pointer' : 'not-allowed',
        }}
        aria-label="Previous month"
      >
        ←
      </button>

      <select
        value={currentMonth}
        onChange={(e) => handleChange(Number(e.target.value), currentYear)}
        style={selectStyle}
        aria-label="Select month"
      >
        {MONTHS.map((month, idx) => {
          // Disable future months in current year
          const isDisabled = currentYear === now.getFullYear() && idx + 1 > now.getMonth() + 1;
          return (
            <option key={month} value={idx + 1} disabled={isDisabled}>
              {month}
            </option>
          );
        })}
      </select>

      <select
        value={currentYear}
        onChange={(e) => {
          const newYear = Number(e.target.value);
          // If switching to current year and current month is beyond available, reset to current month
          let newMonth = currentMonth;
          if (newYear === now.getFullYear() && currentMonth > now.getMonth() + 1) {
            newMonth = now.getMonth() + 1;
          }
          handleChange(newMonth, newYear);
        }}
        style={selectStyle}
        aria-label="Select year"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        style={{
          ...buttonStyle,
          opacity: canGoNext ? 1 : 0.4,
          cursor: canGoNext ? 'pointer' : 'not-allowed',
        }}
        aria-label="Next month"
      >
        →
      </button>

      {!isCurrentMonth && (
        <button
          onClick={handleReset}
          style={{
            ...buttonStyle,
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            fontSize: isCompact ? '0.7rem' : '0.75rem',
            padding: isCompact ? '0.25rem 0.5rem' : '0.375rem 0.625rem',
          }}
        >
          Current
        </button>
      )}

      <span style={{
        fontSize: isCompact ? '0.7rem' : '0.75rem',
        color: 'var(--secondary)',
        marginLeft: isCompact ? '0.25rem' : '0.5rem',
      }}>
        {isCurrentMonth ? '(Current)' : '(Historical)'}
      </span>
    </div>
  );
}
