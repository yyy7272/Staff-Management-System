// Environment configuration
export const environment = {
  // API Configuration  
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    // 在 Docker 环境中，前端通过 nginx 代理访问后端
    typeof window !== 'undefined' && window.location.origin 
      ? `${window.location.origin}/api`
      : 'http://localhost:5000/api'
  ),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // Authentication Configuration
  TOKEN_STORAGE_KEY: 'authToken',
  REFRESH_TOKEN_STORAGE_KEY: 'refreshToken',
  TOKEN_STORAGE_TYPE: 'localStorage', // 'localStorage' or 'sessionStorage'

  // UI Configuration
  MOBILE_BREAKPOINT: 768,
  DEFAULT_PAGE_SIZE: 10,

  // Validation Configuration
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_ADDRESS_LENGTH: 500,

  // File Upload Configuration
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],

  // Feature Flags
  ENABLE_EXPORT: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_STATISTICS: true,

  // Development Settings
  ENABLE_LOGGING: import.meta.env.MODE === 'development',
  ENABLE_DEBUG_MODE: import.meta.env.MODE === 'development',
};

// Validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// API endpoints
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  employees: {
    base: '/Employee',
    bulkDelete: '/Employee/bulk-delete',
    export: '/Employee/export',
    statistics: '/Employee/statistics',
  },
  departments: {
    base: '/Department',
    statistics: '/Department/statistics',
  },
  approvals: {
    base: '/Approval',
    statistics: '/Approval/statistics',
    bulkAction: '/Approval/bulk-action',
  },
  roles: {
    base: '/Role',
    statistics: '/Role/statistics',
  },
  permissions: {
    base: '/Permission',
    resources: '/Permission/resources',
    actions: '/Permission/actions',
    seed: '/Permission/seed',
  },
  payroll: {
    base: '/payroll',
    statistics: '/payroll/statistics',
  },
  notifications: {
    base: '/notification',
  },
  activities: {
    base: '/home',
  },
};

// Status and priority options
export const statusOptions = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'secondary' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'suspended', label: 'Suspended', color: 'error' },
];

export const priorityOptions = [
  { value: 'low', label: 'Low', color: 'info' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'urgent', label: 'Urgent', color: 'error' },
];

export const approvalStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'secondary' },
];

// Utility functions
export const getApiUrl = (endpoint: string): string => {
  return `${environment.API_BASE_URL}${endpoint}`;
};

export const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};

export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};
