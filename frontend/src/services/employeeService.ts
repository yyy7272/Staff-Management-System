import { apiClient } from '../lib/apiClient';
import { apiEndpoints } from '../config/environment';
import { BaseService } from './BaseService';
import type { 
  Employee, 
  ApiResponse, 
  FilterOptions 
} from '../types/common';
import type { 
  EmployeeApi, 
  EmployeeCreateRequest, 
  EmployeeUpdateRequest 
} from '../types/api';

class EmployeeService extends BaseService<Employee, EmployeeCreateRequest, EmployeeUpdateRequest> implements EmployeeApi {
  constructor() {
    super(apiEndpoints.employees.base);
  }

  async export(_filters?: FilterOptions): Promise<Blob> {
    return apiClient.getBlob(`${this.endpoint}/export`);
  }

  async getStatistics(): Promise<ApiResponse<{
    total: number;
    active: number;
    onLeave: number;
    inactive: number;
    trends?: {
      totalEmployeesTrend?: {
        value: number;
        isPositive: boolean;
        text: string;
      };
      activeEmployeesTrend?: {
        value: number;
        isPositive: boolean;
        text: string;
      };
    };
  }>> {
    const backendData = await apiClient.get<{
      totalEmployees: number;
      activeEmployees: number;
      inactiveEmployees: number;
      byDepartment: Array<{ department: string; count: number }>;
      byStatus: Array<{ status: string; count: number }>;
      recentHires: number;
      averageSalary: number;
      trends?: {
        totalEmployeesTrend?: {
          value: number;
          isPositive: boolean;
          text: string;
        };
        activeEmployeesTrend?: {
          value: number;
          isPositive: boolean;
          text: string;
        };
      };
    }>(`${this.endpoint}/statistics`);
    
    // Transform backend data to match frontend expectations
    const data = {
      total: backendData.totalEmployees,
      active: backendData.activeEmployees,
      onLeave: backendData.byStatus.find(s => s.status === 'on-leave')?.count || 0,
      inactive: backendData.inactiveEmployees,
      trends: backendData.trends
    };
    
    return { data, status: 'success' };
  }
}

export const employeeService = new EmployeeService();