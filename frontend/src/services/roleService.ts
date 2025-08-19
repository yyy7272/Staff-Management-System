import { apiClient } from '../lib/apiClient';
import { apiEndpoints } from '../config/environment';
import type { 
  Role, 
  ApiResponse 
} from '../types/common';
import type { 
  RoleApi, 
  RoleCreateRequest, 
  RoleUpdateRequest 
} from '../types/api';

class RoleService implements RoleApi {
  private readonly endpoint = apiEndpoints.roles.base;

  async getAll(): Promise<ApiResponse<Role[]>> {
    const data = await apiClient.get<Role[]>(`${this.endpoint}`);
    return { data, status: 'success' };
  }

  async getById(id: string): Promise<ApiResponse<Role>> {
    const data = await apiClient.get<Role>(`${this.endpoint}/${id}`);
    return { data, status: 'success' };
  }

  async create(data: RoleCreateRequest): Promise<ApiResponse<Role>> {
    const result = await apiClient.post<Role>(`${this.endpoint}`, data);
    return { data: result, status: 'success' };
  }

  async update(id: string, data: RoleUpdateRequest): Promise<ApiResponse<Role>> {
    const result = await apiClient.put<Role>(`${this.endpoint}/${id}`, data);
    return { data: result, status: 'success' };
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete<void>(`${this.endpoint}/${id}`);
    return { data: undefined, status: 'success' };
  }

  async toggleStatus(id: string): Promise<ApiResponse<Role>> {
    const data = await apiClient.patch<Role>(`${this.endpoint}/${id}/toggle-status`);
    return { data, status: 'success' };
  }
}


export const roleService = new RoleService();