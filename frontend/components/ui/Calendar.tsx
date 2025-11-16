import React, { useState, useEffect, useRef } from 'react';

/**
 * Calendar Component
 * Base calendar grid component for rendering a month view with day selection
 * Used by DatePicker and DateRangePicker components
 */

export interface CalendarProps {
  /** Current month to display (YYYY-MM-DD format, only month/year used) */
  month: string; // e.g., "2024-12-01" represents December 2024
  
  /** Selected date(s) - single date string or [start, end] range */
  value?: string | [string | undefined, string | undefined];
  
  /** Callback when a date is clicked */
  onSelect?: (date: string) => void;
  
  /** Minimum selectable date (YYYY-MM-DD) */
  minDate?: string;
  
  /** Maximum selectable date (YYYY-MM-DD) */
  maxDate?: string;
  
  /** Array of disabled dates (YYYY-MM-DD strings) */
  disabledDates?: string[];
  
  /** Function to determine if a date should be disabled */
  isDateDisabled?: (date: string) => boolean;
  
  /** Highlight today's date */
  highlightToday?: boolean;
  
  /** Mode: 'single' for single date selection, 'range' for range selection */
  mode?: 'single' | 'range';
  
  /** For range mode: currently selecting start or end date */
  rangeSelecting?: 'start' | 'end';
  
  /** Class name for container */
  className?: string;
  
  /** Callback when month navigation is requested */
  onMonthChange?: (month: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  month,
  value,
  onSelect,
  minDate,
  maxDate,
  disabledDates = [],
  isDateDisabled,
  highlightToday = true,
  mode = 'single',
  rangeSelecting = 'start',
  className = '',
  onMonthChange,
}) => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<HTMLElement | null>(null);

  // Parse month string to get year and month
  const monthDate = new Date(month + '-01');
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const todayString = getTodayString();

  // Check if date is disabled
  const isDisabled = (dateString: string): boolean => {
    // Check minDate
    if (minDate && dateString < minDate) return true;
    
    // Check maxDate
    if (maxDate && dateString > maxDate) return true;
    
    // Check disabledDates array
    if (disabledDates.includes(dateString)) return true;
    
    // Check custom isDateDisabled function
    if (isDateDisabled && isDateDisabled(dateString)) return true;
    
    return false;
  };

  // Check if date is in selected range (for range mode)
  const isInRange = (dateString: string): boolean => {
    if (mode !== 'range' || !Array.isArray(value)) return false;
    const [start, end] = value;
    if (!start || !end) return false;
    return dateString > start && dateString < end;
  };

  // Check if date is start of range
  const isRangeStart = (dateString: string): boolean => {
    if (mode !== 'range' || !Array.isArray(value)) return false;
    const [start] = value;
    return start === dateString;
  };

  // Check if date is end of range
  const isRangeEnd = (dateString: string): boolean => {
    if (mode !== 'range' || !Array.isArray(value)) return false;
    const [, end] = value;
    return end === dateString;
  };

  // Check if date is selected
  const isSelected = (dateString: string): boolean => {
    if (mode === 'single') {
      return value === dateString;
    }
    if (mode === 'range') {
      return isRangeStart(dateString) || isRangeEnd(dateString);
    }
    return false;
  };

  // Generate date string for a given day
  const getDateString = (day: number): string => {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Handle date click
  const handleDateClick = (dateString: string) => {
    if (isDisabled(dateString)) return;
    if (onSelect) {
      onSelect(dateString);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, dateString: string) => {
    if (isDisabled(dateString)) return;

    let newDate: Date | null = null;
    const currentDate = new Date(dateString);

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleDateClick(dateString);
        return;

      case 'ArrowLeft':
        e.preventDefault();
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        break;

      case 'ArrowDown':
        e.preventDefault();
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        break;

      case 'Home':
        e.preventDefault();
        newDate = new Date(year, monthIndex, 1);
        break;

      case 'End':
        e.preventDefault();
        newDate = new Date(year, monthIndex + 1, 0);
        break;

      case 'PageUp':
        e.preventDefault();
        newDate = new Date(year, monthIndex - 1, currentDate.getDate());
        break;

      case 'PageDown':
        e.preventDefault();
        newDate = new Date(year, monthIndex + 1, currentDate.getDate());
        break;

      default:
        return;
    }

    if (newDate) {
      const newDateString = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      
      // Check if new month (need to notify parent)
      if (newDate.getMonth() !== monthIndex || newDate.getFullYear() !== year) {
        // Notify parent to change month
        const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`;
        if (onMonthChange) {
          onMonthChange(newMonth);
        }
        setFocusedDate(newDateString);
      } else {
        setFocusedDate(newDateString);
        // Focus the cell
        const cell = calendarRef.current?.querySelector(`[data-date="${newDateString}"]`) as HTMLElement;
        if (cell) {
          cell.focus();
          setFocusedCell(cell);
        }
      }
    }
  };

  // Navigation to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const current = new Date(month + '-01');
    const newMonth = direction === 'prev'
      ? new Date(current.getFullYear(), current.getMonth() - 1, 1)
      : new Date(current.getFullYear(), current.getMonth() + 1, 1);
    
    const newMonthString = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, '0')}-01`;
    
    if (onMonthChange) {
      onMonthChange(newMonthString);
    }
  };

  // Generate calendar days
  const calendarDays: Array<{ day: number; dateString: string; isCurrentMonth: boolean }> = [];
  
  // Add days from previous month (to fill first week)
  const prevMonth = new Date(year, monthIndex - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateString = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, dateString, isCurrentMonth: false });
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = getDateString(day);
    calendarDays.push({ day, dateString, isCurrentMonth: true });
  }

  // Add days from next month (to fill last week)
  const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
  const nextMonth = new Date(year, monthIndex + 1, 1);
  for (let day = 1; day <= remainingDays; day++) {
    const dateString = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, dateString, isCurrentMonth: false });
  }

  // Month names for display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      ref={calendarRef}
      className={`bg-white border border-neutral-200 rounded-card shadow-card p-4 ${className}`}
      role="grid"
      aria-label={`Calendar for ${monthNames[monthIndex]} ${year}`}
    >
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-1 rounded-button hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-neutral-900">
          {monthNames[monthIndex]} {year}
        </h3>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-1 rounded-button hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="text-xs font-medium text-neutral-500 uppercase tracking-wide text-center py-2"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" role="rowgroup">
        {calendarDays.map(({ day, dateString, isCurrentMonth }) => {
          const disabled = isDisabled(dateString);
          const selected = isSelected(dateString);
          const isToday = highlightToday && dateString === todayString;
          const inRange = isInRange(dateString);
          const rangeStart = isRangeStart(dateString);
          const rangeEnd = isRangeEnd(dateString);

          let cellClasses = 'text-center py-2 px-3 text-sm rounded-button transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 ';
          
          if (!isCurrentMonth) {
            cellClasses += 'text-neutral-300 ';
          } else {
            cellClasses += 'text-neutral-900 ';
          }

          if (disabled) {
            cellClasses += 'opacity-50 cursor-not-allowed pointer-events-none text-neutral-300 ';
          } else {
            cellClasses += 'cursor-pointer hover:bg-neutral-100 ';
          }

          if (selected) {
            if (mode === 'single') {
              cellClasses += 'bg-neutral-900 text-white hover:bg-neutral-800 ';
            } else if (rangeStart || rangeEnd) {
              cellClasses += 'bg-blue-100 text-blue-900 border-2 border-blue-600 ';
            }
          } else if (inRange) {
            cellClasses += 'bg-blue-50 text-blue-800 ';
          } else if (isToday) {
            cellClasses += 'bg-neutral-100 border-2 border-neutral-900 ';
          }

          return (
            <button
              key={dateString}
              type="button"
              data-date={dateString}
              role="gridcell"
              aria-label={`${dateString}${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              aria-selected={selected}
              aria-disabled={disabled}
              disabled={disabled}
              className={cellClasses}
              onClick={() => handleDateClick(dateString)}
              onKeyDown={(e) => handleKeyDown(e, dateString)}
              tabIndex={selected || focusedDate === dateString ? 0 : -1}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;

