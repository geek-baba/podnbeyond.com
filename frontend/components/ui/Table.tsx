import React from 'react';

// ============================================================================
// Table Component Family
// Design system compliant: neutral-* colors, consistent spacing, accessibility
// ============================================================================

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Root Table component
 * Wraps the entire table structure with responsive overflow-x-auto
 */
export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-neutral-200 ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table Header section
 * Contains all TableHead elements with bg-neutral-100 background
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`bg-neutral-100 ${className}`} {...props}>
      {children}
    </thead>
  );
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table Body section
 * Contains all TableRow elements with bg-white background and divide-neutral-200
 */
export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`bg-white divide-y divide-neutral-200 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean; // Optional hover effect (default: true)
}

/**
 * Table Row component
 * Supports hover effect with hover:bg-neutral-50
 */
export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  hover = true,
  ...props
}) => {
  const hoverClass = hover ? 'hover:bg-neutral-50' : '';
  return (
    <tr className={`${hoverClass} transition-colors duration-150 ${className}`} {...props}>
      {children}
    </tr>
  );
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Table Header Cell
 * Styled with: bg-neutral-100 (inherited from thead), text-neutral-500, uppercase, tracking-wider
 * Spacing: px-6 py-3
 */
export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  align = 'left',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <th
      className={`px-6 py-3 ${alignClass} text-xs font-medium text-neutral-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  nowrap?: boolean; // For whitespace-nowrap utility
}

/**
 * Table Data Cell
 * Styled with: text-neutral-900 for primary content
 * Spacing: px-6 py-4
 */
export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  align = 'left',
  nowrap = false,
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const nowrapClass = nowrap ? 'whitespace-nowrap' : '';
  
  return (
    <td
      className={`px-6 py-4 ${alignClass} ${nowrapClass} text-sm text-neutral-900 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

// Default export for convenience
export default Table;

