import React from 'react';
import Card from './Card';

/**
 * TableContainer Component
 * Wraps a table in a Card-like container with optional header
 */

interface TableContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <Card variant="default" padding="none" className={`overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              )}
              {subtitle && (
                <span className="text-sm text-neutral-500">{subtitle}</span>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      {children}
    </Card>
  );
};

export default TableContainer;

