import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';

/**
 * TableSkeleton Component
 * Displays a loading skeleton for tables with configurable rows and columns
 */

interface TableSkeletonProps {
  rows?: number;
  columns: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 8,
  columns,
  className = '',
}) => {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableHead key={colIndex}>
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-20"></div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <div className="h-4 bg-neutral-200 rounded animate-pulse w-full max-w-xs"></div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TableSkeleton;

