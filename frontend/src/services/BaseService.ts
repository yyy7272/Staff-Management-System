import { apiClient } from '../lib/apiClient';
import type { ApiResponse, FilterOptions } from '../types/common';

export class BaseService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected endpoint: string;
  
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(filters?: FilterOptions): Promise<ApiResponse<T[]>> {
    const data = await apiClient.getWithParams<T[]>(`${this.endpoint}`, filters);
    return { data, status: 'success' };
  }

  async getById(id: string): Promise<ApiResponse<T>> {
    const data = await apiClient.get<T>(`${this.endpoint}/${id}`);
    return { data, status: 'success' };
  }

  async create(data: TCreate): Promise<ApiResponse<T>> {
    const result = await apiClient.post<T>(`${this.endpoint}`, data);
    return { data: result, status: 'success' };
  }

  async update(id: string, data: TUpdate): Promise<ApiResponse<T>> {
    const result = await apiClient.put<T>(`${this.endpoint}/${id}`, data);
    return { data: result, status: 'success' };
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete<void>(`${this.endpoint}/${id}`);
    return { data: undefined, status: 'success' };
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    const data = await apiClient.get<any>(`${this.endpoint}/statistics`);
    return { data, status: 'success' };
  }

  async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
    await apiClient.post<void>(`${this.endpoint}/bulk-delete`, { ids });
    return { data: undefined, status: 'success' };
  }
}