import { toast } from 'sonner';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const parseApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      errors: error.response.data?.errors
    };
  }
  
  if (error.request) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred'
  };
};

export const handleApiError = (error: any, customMessage?: string): void => {
  const apiError = parseApiError(error);
  const message = customMessage || apiError.message;
  
  toast.error(message);
  
  // Log error details for debugging
  console.error('API Error:', {
    message: apiError.message,
    status: apiError.status,
    errors: apiError.errors,
    originalError: error
  });
};

export const getErrorMessage = (error: any, fallback = 'An error occurred'): string => {
  const apiError = parseApiError(error);
  return apiError.message || fallback;
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export const isValidationError = (error: any): boolean => {
  return error.response?.status === 422 || error.response?.status === 400;
};