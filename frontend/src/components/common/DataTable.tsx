import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { Pagination, type PaginationInfo } from "../ui/pagination";
import type { TableColumn, TableAction } from '../../types/common';

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  className?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPagination?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  selectable = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  sortable = false,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = "No data found",
  loading = false,
  className = "",
  pagination,
  onPageChange,
  onPageSizeChange,
  showPagination = false
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedItems.size === data.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < data.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (onSelectItem) {
      onSelectItem(id, checked);
    }
  };

  const handleSort = (field: string) => {
    if (sortable && onSort) {
      onSort(field);
    }
  };

  const renderSortIcon = (field: string) => {
    if (!sortable || sortBy !== field) return null;
    
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderCellContent = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    let value: unknown;
    if (column.key === 'id') {
      value = item.id;
    } else if (typeof column.key === 'string' && column.key in item) {
      value = item[column.key as keyof T];
    } else {
      value = undefined;
    }
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div className="w-full">
        <Table className={className}>
          <TableHeader>
            <TableRow>
              {selectable && <TableHead className="w-12"></TableHead>}
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {actions.length > 0 && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {selectable && <TableCell></TableCell>}
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                ))}
                {actions.length > 0 && <TableCell></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      const input = el.querySelector('input');
                      if (input) {
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead 
                key={String(column.key)} 
                className={`${column.className || ''} ${
                  sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => column.sortable !== false && handleSort(String(column.key))}
              >
                <div className="flex items-center">
                  {column.header}
                  {renderSortIcon(String(column.key))}
                </div>
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell 
                  key={String(column.key)} 
                  className={column.className}
                >
                  {renderCellContent(item, column)}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action, index) => {
                        const Icon = action.icon;
                        const isDisabled = action.disabled ? action.disabled(item) : false;
                        
                        return (
                          <React.Fragment key={index}>
                            <DropdownMenuItem
                              onClick={() => !isDisabled && action.onClick(item)}
                              disabled={isDisabled}
                              className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                            >
                              {Icon && <Icon className="h-4 w-4 mr-2" />}
                              {action.label}
                            </DropdownMenuItem>
                            {index < actions.length - 1 && action.variant === 'destructive' && (
                              <DropdownMenuSeparator />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      )}

      {/* Pagination */}
      {showPagination && pagination && onPageChange && onPageSizeChange && (
        <div className="mt-4">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}