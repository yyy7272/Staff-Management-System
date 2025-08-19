import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface PageHeaderProps {
  title: string;
  onAddClick?: () => void;
  addButtonLabel?: string;
  showAddButton?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  onAddClick,
  addButtonLabel = "Add",
  showAddButton = true,
  children,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="flex items-center gap-2">
        {children}
        {showAddButton && onAddClick && (
          <Button className="gap-2" onClick={onAddClick}>
            <Plus className="h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}