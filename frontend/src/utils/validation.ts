import type { FormErrors } from '../types/common';

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;

export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any, data: T) => string | undefined;
}

export class FormValidator<T extends Record<string, any>> {
  private rules: ValidationRule<T>[] = [];

  constructor(rules: ValidationRule<T>[]) {
    this.rules = rules;
  }

  validate(data: T): FormErrors<T> {
    return this.validateWithOptions(data, { skipRequired: false });
  }

  validatePartial<P extends Partial<T>>(data: P): FormErrors<T> {
    return this.validateWithOptions(data as unknown as T, { skipRequired: true });
  }

  private validateWithOptions(data: T, options: { skipRequired: boolean }): FormErrors<T> {
    const errors: FormErrors<T> = {};

    for (const rule of this.rules) {
      const value = data[rule.field];
      const fieldName = String(rule.field);

      if (!options.skipRequired && rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[rule.field] = `${this.formatFieldName(fieldName)} is required`;
        continue;
      }

      if (!value) continue;

      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors[rule.field] = `${this.formatFieldName(fieldName)} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors[rule.field] = `${this.formatFieldName(fieldName)} must not exceed ${rule.maxLength} characters`;
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors[rule.field] = this.getPatternErrorMessage(fieldName, rule.pattern);
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors[rule.field] = `${this.formatFieldName(fieldName)} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors[rule.field] = `${this.formatFieldName(fieldName)} must not exceed ${rule.max}`;
      }

      if (rule.custom) {
        const customError = rule.custom(value, data);
        if (customError) {
          errors[rule.field] = customError;
        }
      }
    }

    return errors;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getPatternErrorMessage(fieldName: string, pattern: RegExp): string {
    if (pattern === emailRegex) {
      return 'Please enter a valid email address';
    }
    if (pattern === phoneRegex) {
      return 'Please enter a valid phone number';
    }
    return `${this.formatFieldName(fieldName)} format is invalid`;
  }
}

export const createEmployeeValidator = () => new FormValidator([
  { field: 'name', required: true, minLength: 2, maxLength: 100 },
  { field: 'email', required: true, pattern: emailRegex },
  { field: 'position', required: true, minLength: 2, maxLength: 100 },
  { field: 'department', required: true },
  { field: 'hireDate', required: true },
  { field: 'salary', required: true, min: 0 },
  { 
    field: 'phone', 
    pattern: phoneRegex,
    custom: (value: string) => {
      if (value && value.length > 0 && value.length < 10) {
        return 'Phone number must be at least 10 digits';
      }
      return undefined;
    }
  }
]);

export const createDepartmentValidator = () => new FormValidator([
  { field: 'name', required: true, minLength: 2, maxLength: 100 },
  { field: 'manager', minLength: 2, maxLength: 100 },
  { field: 'description', maxLength: 500 }
]);

export const createApprovalValidator = () => new FormValidator([
  { field: 'title', required: true, minLength: 3, maxLength: 200 },
  { field: 'type', required: true },
  { field: 'description', required: true, minLength: 5, maxLength: 1000 },
  { field: 'priority', required: true },
  {
    field: 'startDate',
    custom: (value: string, data: any) => {
      if (value && new Date(value) < new Date()) {
        return 'Start date cannot be in the past';
      }
    }
  },
  {
    field: 'endDate',
    custom: (value: string, data: any) => {
      if (value && data.startDate && new Date(value) <= new Date(data.startDate)) {
        return 'End date must be after start date';
      }
    }
  },
  {
    field: 'amount',
    min: 0,
    custom: (value: number, data: any) => {
      if ((data.type === 'expense' || data.type === 'purchase') && !value) {
        return 'Amount is required for expense and purchase requests';
      }
    }
  }
]);

export const createRoleValidator = () => new FormValidator([
  { field: 'name', required: true, minLength: 3, maxLength: 100 },
  { field: 'description', required: true, minLength: 10, maxLength: 500 }
]);

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
};

export const validateDateRange = (startDate: string, endDate: string): { startDate?: string; endDate?: string } => {
  const errors: { startDate?: string; endDate?: string } = {};
  
  if (!startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!endDate) {
    errors.endDate = 'End date is required';
  }
  
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.endDate = 'End date must be after start date';
  }
  
  return errors;
};