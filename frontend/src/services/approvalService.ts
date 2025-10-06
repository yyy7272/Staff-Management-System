import { apiClient } from '../lib/apiClient';
import { apiEndpoints } from '../config/environment';
import type { 
  ApprovalItem, 
  ApiResponse, 
  FilterOptions 
} from '../types/common';
import type { 
  ApprovalApi, 
  ApprovalCreateRequest, 
  ApprovalActionRequest 
} from '../types/api';

class ApprovalService implements ApprovalApi {
  private readonly endpoint = apiEndpoints.approvals.base;

  // Transform backend data to frontend format
  private transformApprovalData(rawData: any): ApprovalItem {
    return {
      id: rawData.id,
      createdAt: rawData.createdAt,
      updatedAt: rawData.updatedAt,
      title: rawData.title,
      type: rawData.type,
      description: rawData.description,
      priority: rawData.priority,
      status: rawData.status,
      submitDate: rawData.requestDate, // Map requestDate to submitDate
      applicant: {
        name: rawData.applicant?.name || 'Unknown',
        department: rawData.department?.name || 'General', // Use department name or default
        avatar: rawData.applicant?.avatar
      },
      amount: rawData.amount,
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      approver: rawData.approver?.name,
      approvalDate: rawData.responseDate,
      reason: rawData.approvalNotes,
      attachments: rawData.attachments || []
    };
  }

  async getAll(filters?: FilterOptions): Promise<ApiResponse<ApprovalItem[]>> {
    const rawData = await apiClient.getWithParams<any[]>(`${this.endpoint}`, filters);
    const data = rawData.map(item => this.transformApprovalData(item));
    return { data, status: 'success' };
  }

  async getById(id: string): Promise<ApiResponse<ApprovalItem>> {
    const rawData = await apiClient.get<any>(`${this.endpoint}/${id}`);
    const data = this.transformApprovalData(rawData);
    return { data, status: 'success' };
  }

  async create(data: ApprovalCreateRequest): Promise<ApiResponse<ApprovalItem>> {
    const rawResult = await apiClient.post<any>(`${this.endpoint}`, data);
    const result = this.transformApprovalData(rawResult);
    return { data: result, status: 'success' };
  }

  async processAction(id: string, data: ApprovalActionRequest): Promise<ApiResponse<ApprovalItem>> {
    const action = data.action;
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    const rawResult = await apiClient.post<any>(`${this.endpoint}/${id}/${endpoint}`, { notes: data.reason });
    const result = this.transformApprovalData(rawResult);
    return { data: result, status: 'success' };
  }

  async cancel(id: string): Promise<ApiResponse<ApprovalItem>> {
    const rawResult = await apiClient.post<any>(`${this.endpoint}/${id}/cancel`);
    const result = this.transformApprovalData(rawResult);
    return { data: result, status: 'success' };
  }

  async getStatistics(): Promise<ApiResponse<{
    pending: number;
    approved: number;
    rejected: number;
    myTotal: number;
  }>> {
    const data = await apiClient.get<{
      pending: number;
      approved: number;
      rejected: number;
      myTotal: number;
    }>(`${this.endpoint}/statistics`);
    return { data, status: 'success' };
  }

  async getPending(): Promise<ApiResponse<ApprovalItem[]>> {
    const data = await apiClient.get<ApprovalItem[]>(`${this.endpoint}/pending`);
    return { data, status: 'success' };
  }

  async getMyApprovals(): Promise<ApiResponse<ApprovalItem[]>> {
    const data = await apiClient.get<ApprovalItem[]>(`${this.endpoint}/my-approvals`);
    return { data, status: 'success' };
  }
}

export const approvalService = new ApprovalService();