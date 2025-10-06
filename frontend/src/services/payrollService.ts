import { apiClient } from '../lib/apiClient';
import { apiEndpoints } from '../config/environment';
import { BaseService } from './BaseService';
import type { 
  Payroll, 
  ApiResponse, 
  FilterOptions 
} from '../types/common';

class PayrollService extends BaseService<Payroll> {
  constructor() {
    super(apiEndpoints.payroll.base);
  }

  // Override getAll to handle pagination response format
  async getAll(filters?: FilterOptions): Promise<ApiResponse<{data: Payroll[], pagination: any}>> {
    const data = await apiClient.getWithParams<{data: Payroll[], pagination: any}>(`${this.endpoint}`, filters);
    return { data, status: 'success' };
  }

  async updateStatus(id: string, data: { status: string }): Promise<ApiResponse<void>> {
    await apiClient.put<void>(`${this.endpoint}/${id}/status`, data);
    return { data: undefined, status: 'success' };
  }

  // Override getStatistics to provide specific typing
  async getStatistics(): Promise<ApiResponse<{
    totalRecords: number;
    draftRecords: number;
    processedRecords: number;
    paidRecords: number;
    totalPayroll: number;
    averagePayroll: number;
  }>> {
    return super.getStatistics();
  }
}

export const payrollService = new PayrollService();