import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, Clock, User } from 'lucide-react';

interface ConflictingChange {
  userId: string;
  userName: string;
  value: any;
  timestamp: string;
}

interface Conflict {
  conflictId: string;
  fieldName: string;
  conflictingChanges: ConflictingChange[];
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Conflict[];
  onResolveConflict: (conflictId: string, chosenValue: any, userId: string) => void;
  onIgnoreConflict: (conflictId: string) => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onOpenChange,
  conflicts,
  onResolveConflict,
  onIgnoreConflict,
}) => {
  const [selectedValues, setSelectedValues] = useState<Record<string, { value: any; userId: string }>>({});

  if (conflicts.length === 0) {
    return null;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSelectValue = (conflictId: string, value: any, userId: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [conflictId]: { value, userId }
    }));
  };

  const handleResolveAll = () => {
    conflicts.forEach(conflict => {
      const selected = selectedValues[conflict.conflictId];
      if (selected) {
        onResolveConflict(conflict.conflictId, selected.value, selected.userId);
      }
    });
    onOpenChange(false);
  };

  const handleIgnoreAll = () => {
    conflicts.forEach(conflict => {
      onIgnoreConflict(conflict.conflictId);
    });
    onOpenChange(false);
  };

  const canResolve = conflicts.every(conflict => selectedValues[conflict.conflictId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Resolve Data Conflicts</span>
          </DialogTitle>
          <DialogDescription>
            Multiple users have made conflicting changes to the same fields. 
            Please choose which version to keep for each conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {conflicts.map((conflict) => (
            <Card key={conflict.conflictId} className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>Field: "{conflict.fieldName}"</span>
                  <Badge variant="outline" className="text-yellow-700">
                    {conflict.conflictingChanges.length} versions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {conflict.conflictingChanges
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((change, index) => {
                      const isSelected = selectedValues[conflict.conflictId]?.userId === change.userId;
                      
                      return (
                        <div
                          key={`${change.userId}-${change.timestamp}`}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSelectValue(conflict.conflictId, change.value, change.userId)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{change.userName}</span>
                              {index === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Latest
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(change.timestamp)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded border">
                            <div className="font-mono text-sm">
                              {formatValue(change.value)}
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="mt-2 text-sm text-primary font-medium">
                              ✓ Selected
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleIgnoreAll}>
              Ignore All Conflicts
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolveAll}
              disabled={!canResolve}
              className="bg-primary hover:bg-primary/90"
            >
              Resolve All ({Object.keys(selectedValues).length}/{conflicts.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};