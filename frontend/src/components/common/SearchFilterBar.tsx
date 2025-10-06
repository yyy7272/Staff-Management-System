import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  placeholder: string;
  options: FilterOption[];
  width?: string;
}

interface SearchFilterBarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  actions?: React.ReactNode[];
  className?: string;
}

export function SearchFilterBar({
  searchValue = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  actions = [],
  className = ""
}: SearchFilterBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {onSearchChange && (
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filterValues[filter.key] || "all"}
            onValueChange={(value) => onFilterChange?.(filter.key, value)}
          >
            <SelectTrigger className={filter.width || "w-32"}>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        
        {actions.map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </div>
    </div>
  );
}