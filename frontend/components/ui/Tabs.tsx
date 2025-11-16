import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Tabs Component Family
 * Accessible, keyboard-navigable tabs with animated indicators
 */

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  children,
  className = '',
}) => {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`border-b border-neutral-200 mb-6 ${className}`} role="tablist">
      <nav className="-mb-px flex space-x-8">
        {children}
      </nav>
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = '',
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs component');
  }

  const { value: selectedValue, onChange } = context;
  const isActive = selectedValue === value;

  const handleClick = useCallback(() => {
    onChange(value);
  }, [onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(value);
    }
  }, [onChange, value]);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-content-${value}`}
      id={`tab-trigger-${value}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
      } ${className}`}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = '',
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs component');
  }

  const { value: selectedValue } = context;
  const isActive = selectedValue === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tab-content-${value}`}
      aria-labelledby={`tab-trigger-${value}`}
      className={className}
    >
      {children}
    </div>
  );
};

export default Tabs;

