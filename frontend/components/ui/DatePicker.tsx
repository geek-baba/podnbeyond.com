import React, { useState, useRef, useEffect } from 'react';
import Calendar from './Calendar';
import FormField from './FormField';

/**
 * DatePicker Component
 * Single date picker with input field and calendar popover
 * Replaces native <input type="date"> with consistent styling and visual calendar
 */

export interface DatePickerProps {
  /** Selected date value (YYYY-MM-DD string or undefined) */
  value?: string;
  
  /** Callback when date changes */
  onChange: (date: string | undefined) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Label text (for FormField integration) */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Minimum selectable date (YYYY-MM-DD) */
  minDate?: string;
  
  /** Maximum selectable date (YYYY-MM-DD) */
  maxDate?: string;
  
  /** Array of disabled dates */
  disabledDates?: string[];
  
  /** Function to determine if a date should be disabled */
  isDateDisabled?: (date: string) => boolean;
  
  /** Size variant */
  size?: 'sm' | 'md';
  
  /** Input field name (for form submission) */
  name?: string;
  
  /** Input field ID (for accessibility) */
  id?: string;
  
  /** Class name for container */
  className?: string;
  
  /** Whether to highlight today's date in calendar */
  highlightToday?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  isDateDisabled,
  size = 'md',
  name,
  id,
  className = '',
  highlightToday = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return value.substring(0, 7) + '-01';
    return new Date().toISOString().substring(0, 7) + '-01';
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close calendar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Update current month when value changes (if calendar is closed)
  useEffect(() => {
    if (value && !isOpen) {
      setCurrentMonth(value.substring(0, 7) + '-01');
    }
  }, [value, isOpen]);

  // Validate date format (YYYY-MM-DD)
  const isValidDateString = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && 
           dateString === date.toISOString().substring(0, 10);
  };

  // Handle input change (manual typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (!inputValue) {
      onChange(undefined);
      return;
    }

    // Validate format
    if (isValidDateString(inputValue)) {
      onChange(inputValue);
    }
    // Otherwise, let user continue typing
  };

  // Handle input blur (format date if valid)
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    
    if (inputValue && !isValidDateString(inputValue)) {
      // Try to parse and reformat
      const date = new Date(inputValue);
      if (date instanceof Date && !isNaN(date.getTime())) {
        const formatted = date.toISOString().substring(0, 10);
        onChange(formatted);
        if (inputRef.current) {
          inputRef.current.value = formatted;
        }
      } else {
        // Invalid date, reset to current value or empty
        if (inputRef.current) {
          inputRef.current.value = value || '';
        }
      }
    }
  };

  // Handle calendar date selection
  const handleDateSelect = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle input click/focus to open calendar
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle calendar month navigation
  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
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

  const errorId = error ? `${id || 'datepicker'}-error` : undefined;

  const inputElement = (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value || ''}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        aria-required={required}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full border rounded-button focus:outline-none focus:ring-2 ${sizeClasses[size]} ${variantClasses} ${className}`}
      />
      
      {/* Calendar icon */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto focus:outline-none"
        aria-label="Open calendar"
      >
        <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar popover */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 animate-scale-up origin-top-left"
          role="dialog"
          aria-label="Date picker calendar"
        >
          <div className="relative">
            <Calendar
              month={currentMonth}
              value={value}
              onSelect={handleDateSelect}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              isDateDisabled={isDateDisabled}
              highlightToday={highlightToday}
              mode="single"
              className="shadow-hero"
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (error && errorId) {
    return (
      <>
        {label ? (
          <FormField label={label} required={required} error={error}>
            {inputElement}
          </FormField>
        ) : (
          inputElement
        )}
      </>
    );
  }

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

export default DatePicker;

