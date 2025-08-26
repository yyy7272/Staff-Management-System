import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
}

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  className = ''
}: PaginationProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handleFirstPage = () => {
    if (hasPreviousPage) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange(page + 1);
    }
  };

  const handleLastPage = () => {
    if (hasNextPage) {
      onPageChange(totalPages);
    }
  };

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(parseInt(value));
  };

  // Calculate the range of items being displayed
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with ellipsis
      const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null; // Don't show pagination if only one page and no page size selector
  }

  return (
    <div className={`flex items-center justify-between space-x-6 lg:space-x-8 ${className}`}>
      {/* Items info and page size selector */}
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          {total === 0 
            ? 'No items' 
            : `Showing ${startItem} to ${endItem} of ${total} items`
          }
        </p>
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Items per page:</p>
            <Select value={limit.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          {/* First and Previous buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstPage}
              disabled={!hasPreviousPage}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
          </div>

          {/* Next and Last buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastPage}
              disabled={!hasNextPage}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}