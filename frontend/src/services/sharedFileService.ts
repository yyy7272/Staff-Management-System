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

    const response = await apiClient.get(`/api/SharedFile?${params.toString()}`);
    return response.data.data;
  },

  async getFileById(id: string): Promise<SharedFile> {
    const response = await apiClient.get(`/api/SharedFile/${id}`);
    return response.data.data;
  },

  async uploadFile(request: UploadFileRequest): Promise<SharedFile> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.description) formData.append('description', request.description);
    formData.append('tags', request.tags);
    if (request.groupId) formData.append('groupId', request.groupId);
    formData.append('shareType', request.shareType);

    const response = await apiClient.post('/api/SharedFile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateFile(id: string, request: UpdateFileRequest): Promise<SharedFile> {
    const response = await apiClient.put(`/api/SharedFile/${id}`, request);
    return response.data.data;
  },

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/api/SharedFile/${id}`);
  },

  // File download
  async downloadFile(id: string): Promise<Blob> {
    const response = await apiClient.get(`/api/SharedFile/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // File sharing
  async shareFile(request: ShareFileRequest): Promise<FileShare> {
    const response = await apiClient.post(`/api/SharedFile/${request.fileId}/share`, request);
    return response.data.data;
  },

  async getFileShares(fileId: string): Promise<FileShare[]> {
    const response = await apiClient.get(`/api/SharedFile/${fileId}/shares`);
    return response.data.data;
  },

  async getSharedWithMe(): Promise<FileShare[]> {
    const response = await apiClient.get('/api/SharedFile/shared-with-me');
    return response.data.data;
  },

  async revokeShare(shareId: string): Promise<void> {
    await apiClient.delete(`/api/SharedFile/shares/${shareId}`);
  },

  // File discovery
  async getRecentFiles(count: number = 10): Promise<SharedFile[]> {
    const response = await apiClient.get(`/api/SharedFile/recent?count=${count}`);
    return response.data.data;
  },

  // Storage management
  async getStorageUsage(): Promise<StorageUsage> {
    const response = await apiClient.get('/api/SharedFile/storage-usage');
    return response.data.data;
  },

  async getGroupStorageUsage(groupId: string): Promise<StorageUsage> {
    const response = await apiClient.get(`/api/SharedFile/groups/${groupId}/storage-usage`);
    return response.data.data;
  }
};