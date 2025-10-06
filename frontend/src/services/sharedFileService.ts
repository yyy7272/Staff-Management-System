import { apiClient } from '../lib/apiClient';
import type {
  SharedFile,
  UploadFileRequest,
  UpdateFileRequest,
  ShareFileRequest,
  FileShare,
  StorageUsage
} from '../types/sharedFile';

export const sharedFileService = {
  // File CRUD operations
  async getFiles(groupId?: string, shareType?: string): Promise<SharedFile[]> {
    const params = new URLSearchParams();
    if (groupId) params.append('groupId', groupId);
    if (shareType) params.append('shareType', shareType);

    const response = await apiClient.get<{ success: boolean; data: SharedFile[] }>(`/SharedFile?${params.toString()}`);
    return response.data;
  },

  async getFileById(id: string): Promise<SharedFile> {
    const response = await apiClient.get<{ success: boolean; data: SharedFile }>(`/SharedFile/${id}`);
    return response.data;
  },

  async uploadFile(request: UploadFileRequest): Promise<SharedFile> {
    const formData = new FormData();
    formData.append('File', request.file);
    formData.append('Description', request.description || '');
    formData.append('Tags', request.tags || '');
    formData.append('GroupId', request.groupId || '');
    formData.append('ShareType', request.shareType || 'group');

    // Debug logging
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
    }

    const response = await apiClient.post<{ success: boolean; data: SharedFile }>('/SharedFile/upload', formData);
    return response.data;
  },

  async updateFile(id: string, request: UpdateFileRequest): Promise<SharedFile> {
    const response = await apiClient.put<{ success: boolean; data: SharedFile }>(`/SharedFile/${id}`, request);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/SharedFile/${id}`);
  },

  // File download
  async downloadFile(id: string): Promise<Blob> {
    const response = await apiClient.get(`/SharedFile/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // File sharing
  async shareFile(request: ShareFileRequest): Promise<FileShare> {
    const response = await apiClient.post<{ success: boolean; data: FileShare }>(`/SharedFile/${request.fileId}/share`, request);
    return response.data;
  },

  async getFileShares(fileId: string): Promise<FileShare[]> {
    const response = await apiClient.get<{ success: boolean; data: FileShare[] }>(`/SharedFile/${fileId}/shares`);
    return response.data;
  },

  async getSharedWithMe(): Promise<FileShare[]> {
    const response = await apiClient.get<{ success: boolean; data: FileShare[] }>('/SharedFile/shared-with-me');
    return response.data;
  },

  async revokeShare(shareId: string): Promise<void> {
    await apiClient.delete(`/SharedFile/shares/${shareId}`);
  },

  // File discovery
  async getRecentFiles(count: number = 10): Promise<SharedFile[]> {
    const response = await apiClient.get<{ success: boolean; data: SharedFile[] }>(`/SharedFile/recent?count=${count}`);
    return response.data;
  },

  // Storage management
  async getStorageUsage(): Promise<StorageUsage> {
    const response = await apiClient.get<{ success: boolean; data: StorageUsage }>('/SharedFile/storage-usage');
    return response.data;
  },

  async getGroupStorageUsage(groupId: string): Promise<StorageUsage> {
    const response = await apiClient.get<{ success: boolean; data: StorageUsage }>(`/SharedFile/groups/${groupId}/storage-usage`);
    return response.data;
  }
};