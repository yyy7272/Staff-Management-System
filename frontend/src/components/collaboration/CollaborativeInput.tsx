import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { FieldLockIndicator } from './FieldLockIndicator';
import { TypingIndicator } from './TypingIndicator';
import { useCollaboration } from '../../hooks/useCollaboration';

interface CollaborativeInputProps {
  entityType: string;
  entityId: string;
  fieldName: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export const CollaborativeInput: React.FC<CollaborativeInputProps> = ({
  entityType,
  entityId,
  fieldName,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'input',
  disabled = false,
  className = '',
  rows = 3,
}) => {
  const collaboration = useCollaboration({ entityType, entityId });
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lockTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local value when prop changes (from external updates)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const isFieldLocked = collaboration.isFieldLocked(fieldName);
  const lockOwner = collaboration.getFieldLockOwner(fieldName);
  const typingUsers = collaboration.getTypingUsers(fieldName);
  const isDisabled = disabled || isFieldLocked;

  const handleFocus = useCallback(async () => {
    setIsFocused(true);
    
    // Try to lock the field when focusing
    try {
      await collaboration.lockField(fieldName);
      
      // Auto-unlock after 5 minutes of inactivity
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
      lockTimeoutRef.current = setTimeout(() => {
        collaboration.unlockField(fieldName);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.warn('Failed to lock field:', error);
    }
  }, [collaboration, fieldName]);

  const handleBlur = useCallback(async () => {
    setIsFocused(false);
    
    // Stop typing indicator
    await collaboration.stopTyping(fieldName);
    
    // Broadcast final change if value differs
    if (localValue !== value) {
      await collaboration.broadcastFieldChange(fieldName, value, localValue);
      onChange(localValue);
    }
    
    // Unlock the field
    try {
      await collaboration.unlockField(fieldName);
    } catch (error) {
      console.warn('Failed to unlock field:', error);
    }
    
    // Clear auto-unlock timeout
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
    
    onBlur?.();
  }, [collaboration, fieldName, localValue, value, onChange, onBlur]);

  const handleChange = useCallback(async (newValue: string) => {
    setLocalValue(newValue);
    
    // Start typing indicator
    collaboration.startTyping(fieldName);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Debounce the change broadcast
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        // Broadcast the change
        await collaboration.broadcastFieldChange(fieldName, value, newValue);
        
        // Update parent component
        onChange(newValue);
        
        // Stop typing indicator
        await collaboration.stopTyping(fieldName);
      } catch (error) {
        console.warn('Failed to broadcast change:', error);
      }
    }, 500); // 500ms debounce
  }, [collaboration, fieldName, value, onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
      
      // Clean up if component was focused
      if (isFocused) {
        collaboration.stopTyping(fieldName);
        collaboration.unlockField(fieldName);
      }
    };
  }, [collaboration, fieldName, isFocused]);

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldName} className="flex items-center space-x-2">
            <span>{label}</span>
            <FieldLockIndicator
              fieldName={fieldName}
              isLocked={isFieldLocked}
              lockOwner={lockOwner}
              size="sm"
            />
          </Label>
          
          {typingUsers.length > 0 && (
            <TypingIndicator
              fieldName={fieldName}
              typingUsers={typingUsers}
              className="ml-auto"
            />
          )}
        </div>
      )}
      
      <div className="relative">
        <InputComponent
          id={fieldName}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isDisabled}
          className={`${isFieldLocked ? 'border-red-200 bg-red-50' : ''} ${
            isFocused && collaboration.connected ? 'border-blue-300 ring-1 ring-blue-300' : ''
          }`}
          rows={type === 'textarea' ? rows : undefined}
        />
        
        {/* Connection status indicator */}
        {isFocused && (
          <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
            {collaboration.connected ? (
              <span className="text-green-600">● Live collaboration active</span>
            ) : (
              <span className="text-red-600">● Collaboration disconnected</span>
            )}
          </div>
        )}
      </div>
      
      {/* Field lock warning */}
      {isFieldLocked && lockOwner && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          This field is currently being edited by {lockOwner}. 
          Please wait for them to finish.
        </div>
      )}
    </div>
  );
};