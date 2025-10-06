import React from 'react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Lock, LockOpen, AlertTriangle } from 'lucide-react';

interface FieldLockIndicatorProps {
  fieldName: string;
  isLocked: boolean;
  lockOwner?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FieldLockIndicator: React.FC<FieldLockIndicatorProps> = ({
  fieldName,
  isLocked,
  lockOwner,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (!isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <LockOpen className={`${sizeClasses[size]} text-green-500 ${className}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Field "{fieldName}" is available for editing</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center space-x-1 ${className}`}>
            <Lock className={`${sizeClasses[size]} text-red-500`} />
            {size !== 'sm' && (
              <Badge variant="secondary" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span>Field Locked</span>
            </div>
            <div className="mt-1">
              Field "{fieldName}" is currently being edited by{' '}
              <span className="font-medium">{lockOwner || 'another user'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Please wait for the user to finish editing this field.
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};