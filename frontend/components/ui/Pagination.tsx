import React from 'react';
import Button from './Button';

/**
 * Pagination Component
 * Accessible pagination controls with page navigation
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showItemCount?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
  showItemCount = true,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showItemCount && (
        <div className="text-sm text-neutral-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
      )}
      <div className="flex space-x-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="sm"
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="secondary"
          size="sm"
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

