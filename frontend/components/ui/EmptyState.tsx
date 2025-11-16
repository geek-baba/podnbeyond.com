import React from 'react';

/**
 * EmptyState Component
 * Displays a consistent empty state message with optional icon, title, and description
 */

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'table' | 'search' | 'filter' | 'generic';
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  variant = 'generic',
  action,
  className = '',
}) => {
  // Variant-specific padding
  const variantPadding = {
    table: 'py-12',
    search: 'py-16',
    filter: 'py-12',
    generic: 'py-12',
  };

  return (
    <div className={`text-center ${variantPadding[variant]} ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-neutral-900 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-neutral-500 mb-4">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;

