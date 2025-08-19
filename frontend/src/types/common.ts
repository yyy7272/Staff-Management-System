export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Employee extends BaseEntity {
  name: string;
  email: string;
  position: string;
  department: Department | string; // Can be either Department object or string
  hireDate: string;
  salary: number;
  status: "active" | "inactive" | "on-leave";
  avatar?: string;
  profileImagePath?: string;
  profileImageUrl?: string;
  thumbnailImagePath?: string;
  thumbnailImageUrl?: string;
  phone?: string;
  address?: string;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  manager?: string;
  employeeCount: number;
  children?: Department[];
}

export interface ApprovalItem extends BaseEntity {
  title: string;
  type: "leave" | "expense" | "purchase" | "other";
  applicant: {
    name: string;
    department: string;
    avatar?: string;
  };
  amount?: number;
  startDate?: string;
  endDate?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  submitDate: string;
  description: string;
  approver?: string;
  approvalDate?: string;
  reason?: string;
  attachments?: string[];
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  level?: string;
  isActive: boolean;
  userCount: number;
  permissions: Permission[];
}

export interface Permission extends BaseEntity {
  name: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
  roleCount: number;
}

export interface StatisticCardData {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  disabled?: (item: T) => boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "textarea" | "select" | "checkbox" | "radio";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | undefined;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: "success" | "error";
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  search?: string;
  status?: string;
  department?: string;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface Activity {
  id: string;
  type: string;
  action: string;
  description: string;
  entityName?: string;
  entityId?: string;
  userName: string;
  createdAt: string;
  timeAgo: string;
}

export interface Notification {
  id: string;
  type: "approval" | "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  entityType?: string;
  entityId?: string;
  triggeredByUserName?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  timeAgo: string;
}

export interface Payroll extends BaseEntity {
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    position: string;
    department: string;
  };
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  taxWithholding: number;
  netPay: number;
  status: "draft" | "processed" | "paid";
  notes?: string;
  processedBy?: string;
  processedAt?: string;
}