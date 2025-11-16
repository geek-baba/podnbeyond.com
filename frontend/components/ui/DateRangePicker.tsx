import React, { useState, useRef, useEffect } from 'react';
import Calendar from './Calendar';
import FormField from './FormField';

/**
 * DateRangePicker Component
 * Date range picker for selecting start and end dates
 * Used in BookingFilters, Analytics, and any range filters
 */

export interface DateRangePickerProps {
  /** Selected date range [startDate, endDate] (YYYY-MM-DD strings) */
  value?: [string | undefined, string | undefined];
  
  /** Callback when range changes */
  onChange: (range: [string | undefined, string | undefined]) => void;
  
  /** Placeholder text for start date input */
  startPlaceholder?: string;
  
  /** Placeholder text for end date input */
  endPlaceholder?: string;
  
  /** Label text for the range picker */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Minimum selectable date for start (YYYY-MM-DD) */
  minDate?: string;
  
  /** Maximum selectable date for end (YYYY-MM-DD) */
  maxDate?: string;
  
  /** Array of disabled dates */
  disabledDates?: string[];
  
  /** Function to determine if a date should be disabled */
  isDateDisabled?: (date: string) => boolean;
  
  /** Size variant */
  size?: 'sm' | 'md';
  
  /** Input field names (for form submission) */
  startName?: string;
  endName?: string;
  
  /** Input field IDs (for accessibility) */
  startId?: string;
  endId?: string;
  
  /** Whether to show as single calendar with range selection or two separate pickers */
  variant?: 'connected' | 'separate';
  
  /** Class name for container */
  className?: string;
  
  /** Whether to highlight today's date */
  highlightToday?: boolean;
  
  /** Whether to enforce end >= start (basic validation, can be overridden by parent) */
  enforceRange?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = [undefined, undefined],
  onChange,
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  label,
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  isDateDisabled,
  size = 'md',
  startName,
  endName,
  startId,
  endId,
  variant = 'separate',
  className = '',
  highlightToday = true,
  enforceRange = true,
}) => {
  const [startDate, endDate] = value;
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isConnectedOpen, setIsConnectedOpen] = useState(false);
  const [rangeSelecting, setRangeSelecting] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) return startDate.substring(0, 7) + '-01';
    return new Date().toISOString().substring(0, 7) + '-01';
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsStartOpen(false);
        setIsEndOpen(false);
        setIsConnectedOpen(false);
      }
    };

    if (isStartOpen || isEndOpen || isConnectedOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isStartOpen, isEndOpen, isConnectedOpen]);

  // Close calendar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStartOpen(false);
        setIsEndOpen(false);
        setIsConnectedOpen(false);
        if (isStartOpen) startInputRef.current?.focus();
        if (isEndOpen) endInputRef.current?.focus();
      }
    };

    if (isStartOpen || isEndOpen || isConnectedOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isStartOpen, isEndOpen, isConnectedOpen]);

  // Validate date format
  const isValidDateString = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && 
           dateString === date.toISOString().substring(0, 10);
  };

  // Handle start date change
  const handleStartChange = (date: string | undefined) => {
    const newEndDate = enforceRange && date && endDate && endDate < date ? undefined : endDate;
    onChange([date, newEndDate]);
  };

  // Handle end date change
  const handleEndChange = (date: string | undefined) => {
    if (enforceRange && date && startDate && date < startDate) {
      // Invalid range - don't update, show error
      return;
    }
    onChange([startDate, date]);
  };

  // Handle connected calendar month navigation
  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  // Handle connected calendar date selection
  const handleConnectedSelect = (dateString: string) => {
    if (rangeSelecting === 'start') {
      // Selecting start date
      if (endDate && dateString > endDate) {
        // If selected date is after end date, reset end date and set as start
        onChange([dateString, undefined]);
        setRangeSelecting('end');
      } else {
        onChange([dateString, endDate]);
        setRangeSelecting('end');
      }
    } else {
      // Selecting end date
      if (!startDate || dateString < startDate) {
        // Invalid - treat as new start date
        onChange([dateString, undefined]);
        setRangeSelecting('end');
      } else {
        onChange([startDate, dateString]);
        setIsConnectedOpen(false);
        setRangeSelecting('start');
      }
    }
  };

  // Handle input changes (manual typing)
  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      handleStartChange(undefined);
      return;
    }
    if (isValidDateString(inputValue)) {
      handleStartChange(inputValue);
    }
  };

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      handleEndChange(undefined);
      return;
    }
    if (isValidDateString(inputValue)) {
      handleEndChange(inputValue);
    }
  };

  // Handle input blur
  const handleStartBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    if (inputValue && !isValidDateString(inputValue)) {
      const date = new Date(inputValue);
      if (date instanceof Date && !isNaN(date.getTime())) {
        const formatted = date.toISOString().substring(0, 10);
        handleStartChange(formatted);
        if (startInputRef.current) {
          startInputRef.current.value = formatted;
        }
      } else {
        if (startInputRef.current) {
          startInputRef.current.value = startDate || '';
        }
      }
    }
  };

  const handleEndBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    if (inputValue && !isValidDateString(inputValue)) {
      const date = new Date(inputValue);
      if (date instanceof Date && !isNaN(date.getTime())) {
        const formatted = date.toISOString().substring(0, 10);
        handleEndChange(formatted);
        if (endInputRef.current) {
          endInputRef.current.value = formatted;
        }
      } else {
        if (endInputRef.current) {
          endInputRef.current.value = endDate || '';
        }
      }
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
  };

  const variantClasses = error
    ? 'border-red-500 focus:ring-red-600 focus:border-red-600'
    : disabled
    ? 'border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed'
    : 'border-neutral-300 focus:ring-neutral-900 focus:border-neutral-900';

  // Calculate effective min/max for end date picker
  const endMinDate = enforceRange && startDate ? startDate : minDate;

  const errorId = error ? `${startId || 'daterangepicker'}-error` : undefined;

  if (variant === 'connected') {
    // Single calendar with range selection
    const inputElement = (
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-2">
          <input
            ref={startInputRef}
            type="text"
            id={startId}
            name={startName}
            value={startDate || ''}
            onChange={handleStartInputChange}
            onBlur={handleStartBlur}
            onFocus={() => {
              if (!disabled) {
                setIsConnectedOpen(true);
                setRangeSelecting('start');
              }
            }}
            placeholder={startPlaceholder}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={`flex-1 border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses} ${className}`}
          />
          <span className="text-neutral-500 text-sm">to</span>
          <input
            ref={endInputRef}
            type="text"
            id={endId}
            name={endName}
            value={endDate || ''}
            onChange={handleEndInputChange}
            onBlur={handleEndBlur}
            onFocus={() => {
              if (!disabled) {
                setIsConnectedOpen(true);
                setRangeSelecting('end');
              }
            }}
            placeholder={endPlaceholder}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={`flex-1 border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses}`}
          />
          <button
            type="button"
            onClick={() => !disabled && setIsConnectedOpen(!isConnectedOpen)}
            disabled={disabled}
            className="p-2 rounded-button hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            aria-label="Open calendar"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {isConnectedOpen && !disabled && (
          <div
            className="absolute z-50 mt-1 animate-scale-up origin-top-left"
            role="dialog"
            aria-label="Date range picker calendar"
          >
            <Calendar
              month={currentMonth}
              value={[startDate, endDate]}
              onSelect={handleConnectedSelect}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              isDateDisabled={isDateDisabled}
              highlightToday={highlightToday}
              mode="range"
              rangeSelecting={rangeSelecting}
              className="shadow-hero"
              onMonthChange={handleMonthChange}
            />
          </div>
        )}
      </div>
    );

    if (label) {
      return (
        <FormField label={label} required={required} error={error}>
          {inputElement}
        </FormField>
      );
    }

    return inputElement;
  }

  // Separate variant: two independent DatePicker-like inputs
  // For now, we'll create two simplified pickers that share Calendar component
  const handleStartCalendarSelect = (dateString: string) => {
    handleStartChange(dateString);
    setIsStartOpen(false);
    startInputRef.current?.focus();
  };

  const handleEndCalendarSelect = (dateString: string) => {
    handleEndChange(dateString);
    setIsEndOpen(false);
    endInputRef.current?.focus();
  };

  const inputElement = (
    <div className="flex items-center gap-2" ref={containerRef}>
      {/* Start date input */}
      <div className="relative flex-1">
        <input
          ref={startInputRef}
          type="text"
          id={startId}
          name={startName}
          value={startDate || ''}
          onChange={handleStartInputChange}
          onBlur={handleStartBlur}
          onFocus={() => !disabled && setIsStartOpen(true)}
          placeholder={startPlaceholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses} ${className}`}
        />
        {isStartOpen && !disabled && (
          <div
            className="absolute z-50 mt-1 animate-scale-up origin-top-left"
            role="dialog"
            aria-label="Start date picker"
          >
            <Calendar
              month={startDate ? startDate.substring(0, 7) + '-01' : currentMonth}
              value={startDate}
              onSelect={handleStartCalendarSelect}
              minDate={minDate}
              maxDate={endDate || maxDate}
              disabledDates={disabledDates}
              isDateDisabled={isDateDisabled}
              highlightToday={highlightToday}
              mode="single"
              className="shadow-hero"
              onMonthChange={(month) => setCurrentMonth(month)}
            />
          </div>
        )}
      </div>

      {/* Separator */}
      <span className="text-neutral-500 text-sm whitespace-nowrap">to</span>

      {/* End date input */}
      <div className="relative flex-1">
        <input
          ref={endInputRef}
          type="text"
          id={endId}
          name={endName}
          value={endDate || ''}
          onChange={handleEndInputChange}
          onBlur={handleEndBlur}
          onFocus={() => !disabled && setIsEndOpen(true)}
          placeholder={endPlaceholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses}`}
        />
        {isEndOpen && !disabled && (
          <div
            className="absolute z-50 mt-1 animate-scale-up origin-top-right"
            role="dialog"
            aria-label="End date picker"
          >
            <Calendar
              month={endDate ? endDate.substring(0, 7) + '-01' : startDate ? startDate.substring(0, 7) + '-01' : currentMonth}
              value={endDate}
              onSelect={handleEndCalendarSelect}
              minDate={endMinDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              isDateDisabled={isDateDisabled}
              highlightToday={highlightToday}
              mode="single"
              className="shadow-hero"
              onMonthChange={(month) => setCurrentMonth(month)}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        {inputElement}
      </FormField>
    );
  }

  return (
    <>
      {inputElement}
      {error && errorId && (
        <div id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </>
  );
};

export default DateRangePicker;

