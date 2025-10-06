import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import type { FormFieldConfig, FormErrors } from '../../types/common';

interface FormDialogProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldConfig[];
  data: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onFieldChange: (field: string, value: any) => void;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: string;
}

export function FormDialog<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  fields,
  data,
  errors,
  isSubmitting,
  onSubmit,
  onFieldChange,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  maxWidth = "max-w-2xl"
}: FormDialogProps<T>) {
  const renderField = (field: FormFieldConfig) => {
    const value = data[field.name];
    const error = errors[field.name as keyof T];
    const fieldId = `${field.name}-field`;

    const commonProps = {
      id: fieldId,
      placeholder: field.placeholder,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        onFieldChange(field.name, e.target.value),
      className: error ? "border-red-500" : ""
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(value) => onFieldChange(field.name, value)}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onFieldChange(field.name, checked)}
            />
            <Label htmlFor={fieldId}>{field.label}</Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup 
            value={value || ''} 
            onValueChange={(value) => onFieldChange(field.name, value)}
            className="flex gap-6"
          >
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                <Label htmlFor={`${fieldId}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => onFieldChange(field.name, parseFloat(e.target.value) || 0)}
          />
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
          />
        );

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
          />
        );
    }
  };

  const renderFieldWithLabel = (field: FormFieldConfig) => {
    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className="space-y-2">
          {renderField(field)}
          {errors[field.name as keyof T] && (
            <p className="text-sm text-red-500">{errors[field.name as keyof T]}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={`${field.name}-field`}>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>
        {renderField(field)}
        {errors[field.name as keyof T] && (
          <p className="text-sm text-red-500">{errors[field.name as keyof T]}</p>
        )}
      </div>
    );
  };

  const groupFields = () => {
    const groups: FormFieldConfig[][] = [];
    let currentGroup: FormFieldConfig[] = [];
    
    fields.forEach((field, index) => {
      currentGroup.push(field);
      
      // Create new group every 2 fields (for 2-column layout) or if it's a textarea/special field
      if (currentGroup.length === 2 || field.type === 'textarea' || field.type === 'radio' || index === fields.length - 1) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    });
    
    return groups;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${maxWidth} max-h-[80vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {groupFields().map((group, groupIndex) => (
            <div 
              key={groupIndex} 
              className={group.length > 1 && group.every(f => f.type !== 'textarea' && f.type !== 'radio') 
                ? "grid grid-cols-2 gap-4" 
                : "space-y-4"
              }
            >
              {group.map(renderFieldWithLabel)}
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onSubmit} 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}