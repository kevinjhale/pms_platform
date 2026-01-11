'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface DateRangeSelectorProps {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCompact?: boolean;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Generate list of month-year options for past 24 months
function generateMonthOptions(): { value: string; label: string; month: number; year: number }[] {
  const now = new Date();
  const options: { value: string; label: string; month: number; year: number }[] = [];

  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    options.push({
      value: `${year}-${month}`,
      label: `${MONTHS[month - 1]} ${year}`,
      month,
      year,
    });
  }

  return options;
}

export function DateRangeSelector({
  startMonth,
  startYear,
  endMonth,
  endYear,
  isCompact = false,
}: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthOptions = generateMonthOptions();

  const handleChange = useCallback((
    newStartMonth: number,
    newStartYear: number,
    newEndMonth: number,
    newEndYear: number
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('startMonth', String(newStartMonth));
    params.set('startYear', String(newStartYear));
    params.set('endMonth', String(newEndMonth));
    params.set('endYear', String(newEndYear));
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleStartChange = useCallback((value: string) => {
    const [year, month] = value.split('-').map(Number);
    // If start is after end, set end to start
    const startDate = new Date(year, month - 1);
    const endDate = new Date(endYear, endMonth - 1);
    if (startDate > endDate) {
      handleChange(month, year, month, year);
    } else {
      handleChange(month, year, endMonth, endYear);
    }
  }, [endMonth, endYear, handleChange]);

  const handleEndChange = useCallback((value: string) => {
    const [year, month] = value.split('-').map(Number);
    // If end is before start, set start to end
    const startDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(year, month - 1);
    if (endDate < startDate) {
      handleChange(month, year, month, year);
    } else {
      handleChange(startMonth, startYear, month, year);
    }
  }, [startMonth, startYear, handleChange]);

  const handleReset = useCallback(() => {
    router.push('?');
  }, [router]);

  // Check if we're at the current month (default state)
  const now = new Date();
  const isDefault = startMonth === now.getMonth() + 1 &&
                    startYear === now.getFullYear() &&
                    endMonth === now.getMonth() + 1 &&
                    endYear === now.getFullYear();

  const isSingleMonth = startMonth === endMonth && startYear === endYear;

  const selectStyle = {
    padding: isCompact ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
    fontSize: isCompact ? '0.75rem' : '0.875rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    cursor: 'pointer',
    outline: 'none',
    minWidth: isCompact ? '100px' : '120px',
  };

  const labelStyle = {
    fontSize: isCompact ? '0.7rem' : '0.75rem',
    color: 'var(--secondary)',
    marginRight: '0.25rem',
  };

  const buttonStyle = {
    padding: isCompact ? '0.375rem 0.625rem' : '0.5rem 0.75rem',
    fontSize: isCompact ? '0.75rem' : '0.875rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    cursor: 'pointer',
  };

  // Quick presets
  const setLastNMonths = useCallback((n: number) => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - n + 1, 1);
    handleChange(
      start.getMonth() + 1,
      start.getFullYear(),
      end.getMonth() + 1,
      end.getFullYear()
    );
  }, [handleChange]);

  const setYTD = useCallback(() => {
    const now = new Date();
    handleChange(1, now.getFullYear(), now.getMonth() + 1, now.getFullYear());
  }, [handleChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '0.5rem' : '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '0.75rem' : '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={labelStyle}>From:</span>
          <select
            value={`${startYear}-${startMonth}`}
            onChange={(e) => handleStartChange(e.target.value)}
            style={selectStyle}
            aria-label="Start month"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={labelStyle}>To:</span>
          <select
            value={`${endYear}-${endMonth}`}
            onChange={(e) => handleEndChange(e.target.value)}
            style={selectStyle}
            aria-label="End month"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!isDefault && (
          <button
            onClick={handleReset}
            style={{
              ...buttonStyle,
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Quick presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ ...labelStyle, marginRight: '0.25rem' }}>Quick:</span>
        <button onClick={() => setLastNMonths(1)} style={buttonStyle}>This Month</button>
        <button onClick={() => setLastNMonths(3)} style={buttonStyle}>Last 3 Mo</button>
        <button onClick={() => setLastNMonths(6)} style={buttonStyle}>Last 6 Mo</button>
        <button onClick={() => setLastNMonths(12)} style={buttonStyle}>Last 12 Mo</button>
        <button onClick={setYTD} style={buttonStyle}>YTD</button>
      </div>

      {/* Date range summary */}
      <div style={{
        fontSize: isCompact ? '0.7rem' : '0.75rem',
        color: 'var(--secondary)',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--surface)',
        borderRadius: '4px',
        display: 'inline-block',
        width: 'fit-content',
      }}>
        {isSingleMonth
          ? `Showing: ${MONTHS[startMonth - 1]} ${startYear}`
          : `Showing: ${MONTHS[startMonth - 1]} ${startYear} - ${MONTHS[endMonth - 1]} ${endYear}`}
      </div>
    </div>
  );
}

// Keep backward compatibility alias
export { DateRangeSelector as MonthYearSelector };
