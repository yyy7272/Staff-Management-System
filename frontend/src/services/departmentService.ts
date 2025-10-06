import { apiEndpoints } from '../config/environment';
import { BaseService } from './BaseService';
import type { 
  Department, 
  ApiResponse 
} from '../types/common';
import type { 
  DepartmentApi, 
  DepartmentCreateRequest, 
  DepartmentUpdateRequest 
} from '../types/api';

class DepartmentService extends BaseService<Department, DepartmentCreateRequest, DepartmentUpdateRequest> implements DepartmentApi {
  constructor() {
    super(apiEndpoints.departments.base);
  }

  // Override getStatistics to provide specific typing
  async getStatistics(): Promise<ApiResponse<{
    totalDepts: number;
    parentDepts: number;
    childDepts: number;
    totalEmployees: number;
  }>> {
    return super.getStatistics();
  }
}

export const departmentService = new DepartmentService();