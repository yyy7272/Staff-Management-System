import type { Employee, Department, ApprovalItem, Role, Permission, ApiResponse, FilterOptions } from './common';

export interface EmployeeCreateRequest {
  name: string;
  email: string;
  position: string;
  departmentId: string;
  hireDate: string;
  salary: number;
  phone?: string;
  address?: string;
  status?: "active" | "inactive" | "on-leave";
  [key: string]: unknown;
}

export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {
  status?: "active" | "inactive" | "on-leave";
}

export interface DepartmentCreateRequest {
  name: string;
  description?: string;
  manager?: string;
  parentId?: string;
  [key: string]: unknown;
}

export interface DepartmentUpdateRequest extends Partial<DepartmentCreateRequest> {
  [key: string]: unknown;
}

export interface ApprovalCreateRequest {
  title: string;
  type: "leave" | "expense" | "purchase" | "other";
  description: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  attachments?: string[];
  [key: string]: unknown;
}

export interface ApprovalActionRequest {
  action: "approve" | "reject";
  reason?: string;
}

export interface RoleCreateRequest {
  name: string;
  description: string;
  permissions: string[];
  [key: string]: unknown;
}

export interface RoleUpdateRequest extends Partial<RoleCreateRequest> {
  [key: string]: unknown;
}

// API Service Interfaces
export interface EmployeeApi {
  getAll: (filters?: FilterOptions) => Promise<ApiResponse<Employee[]>>;
  getById: (id: string) => Promise<ApiResponse<Employee>>;
  create: (data: EmployeeCreateRequest) => Promise<ApiResponse<Employee>>;
  update: (id: string, data: EmployeeUpdateRequest) => Promise<ApiResponse<Employee>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
  bulkDelete: (ids: string[]) => Promise<ApiResponse<void>>;
  export: (filters?: FilterOptions) => Promise<Blob>;
}

export interface DepartmentApi {
  getAll: () => Promise<ApiResponse<Department[]>>;
  getById: (id: string) => Promise<ApiResponse<Department>>;
  create: (data: DepartmentCreateRequest) => Promise<ApiResponse<Department>>;
  update: (id: string, data: DepartmentUpdateRequest) => Promise<ApiResponse<Department>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
  getStatistics: () => Promise<ApiResponse<{
    totalDepts: number;
    parentDepts: number;
    childDepts: number;
    totalEmployees: number;
  }>>;
}

export interface ApprovalApi {
  getAll: (filters?: FilterOptions) => Promise<ApiResponse<ApprovalItem[]>>;
  getById: (id: string) => Promise<ApiResponse<ApprovalItem>>;
  create: (data: ApprovalCreateRequest) => Promise<ApiResponse<ApprovalItem>>;
  processAction: (id: string, data: ApprovalActionRequest) => Promise<ApiResponse<ApprovalItem>>;
  cancel: (id: string) => Promise<ApiResponse<ApprovalItem>>;
  getStatistics: () => Promise<ApiResponse<{
    pending: number;
    approved: number;
    rejected: number;
    myTotal: number;
  }>>;
}

export interface RoleApi {
  getAll: () => Promise<ApiResponse<Role[]>>;
  getById: (id: string) => Promise<ApiResponse<Role>>;
  create: (data: RoleCreateRequest) => Promise<ApiResponse<Role>>;
  update: (id: string, data: RoleUpdateRequest) => Promise<ApiResponse<Role>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
  toggleStatus: (id: string) => Promise<ApiResponse<Role>>;
}

export interface PermissionApi {
  getAll: () => Promise<ApiResponse<Permission[]>>;
  toggle: (id: string) => Promise<ApiResponse<Permission>>;
}