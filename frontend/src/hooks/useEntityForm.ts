import { useState, useCallback, useRef } from 'react';
import type { FormErrors } from '../types/common';

export interface UseEntityFormOptions<T> {
  initialData: T;
  onSubmit?: (data: T) => Promise<{ success: boolean; errors?: FormErrors<T> }>;
  onSuccess?: () => void;
  onError?: (errors: FormErrors<T>) => void;
}

export interface EntityFormState<T> {
  formData: T;
  formErrors: FormErrors<T>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface EntityFormActions<T> {
  setFormData: (data: T | ((prev: T) => T)) => void;
  handleFieldChange: (field: keyof T, value: unknown) => void;
  setFormErrors: (errors: FormErrors<T> | ((prev: FormErrors<T>) => FormErrors<T>)) => void;
  clearFieldError: (field: keyof T) => void;
  resetForm: () => void;
  submitForm: () => Promise<void>;
  populateForm: (data: Partial<T>) => void;
}

export function useEntityForm<T extends Record<string, unknown>>({
  initialData,
  onSubmit,
  onSuccess,
  onError
}: UseEntityFormOptions<T>): EntityFormState<T> & EntityFormActions<T> {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;
  
  const [formData, setFormData] = useState<T>(initialData);
  const [formErrors, setFormErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = useCallback((field: keyof T, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    setFormErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ ...initialDataRef.current });
    setFormErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, []);

  const populateForm = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setFormErrors({});
    setIsDirty(false);
  }, []);

  const submitForm = useCallback(async () => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        onSuccess?.();
      } else if (result.errors) {
        setFormErrors(result.errors);
        onError?.(result.errors);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const generalError = { general: 'An unexpected error occurred' } as FormErrors<T>;
      setFormErrors(generalError);
      onError?.(generalError);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, onSuccess, onError]);

  return {
    formData,
    formErrors,
    isSubmitting,
    isDirty,
    setFormData,
    handleFieldChange,
    setFormErrors,
    clearFieldError,
    resetForm,
    submitForm,
    populateForm
  };
}