import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

/**
 * Select Component
 * Accessible dropdown/select component with keyboard navigation
 */

interface SelectContextType {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, onChange, isOpen, setIsOpen }}>
      <div className={`relative ${className}`} ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  placeholder?: string;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  placeholder = 'Select...',
  className = '',
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within Select component');
  }

  const { value, isOpen, setIsOpen } = context;

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`w-full px-3 py-2 border border-neutral-300 rounded-button bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      <span className="block truncate">
        {value || <span className="text-neutral-500">{placeholder}</span>}
      </span>
      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </button>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectContent must be used within Select component');
  }

  const { isOpen } = context;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-card shadow-card max-h-60 overflow-auto ${className}`}
      role="listbox"
    >
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = '',
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within Select component');
  }

  const { value: selectedValue, onChange, setIsOpen } = context;
  const isSelected = selectedValue === value;

  const handleClick = () => {
    onChange(value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(value);
      setIsOpen(false);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`px-3 py-2 text-sm cursor-pointer transition-colors focus:outline-none focus:bg-neutral-100 ${
        isSelected
          ? 'bg-neutral-100 text-neutral-900 font-medium'
          : 'text-neutral-700 hover:bg-neutral-50'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Select;

