import { apiClient } from '../lib/apiClient';
import type { Notification, ApiResponse } from '../types/common';

class NotificationService {
  private readonly endpoint = '/notification';

  async getNotifications(count: number = 10, unreadOnly: boolean = false): Promise<ApiResponse<Notification[]>> {
    const params = new URLSearchParams();
    params.append('count', count.toString());
    if (unreadOnly) {
      params.append('unreadOnly', 'true');
    }
    
    const data = await apiClient.get<Notification[]>(`${this.endpoint}?${params.toString()}`);
    return { data, status: 'success' };
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    await apiClient.post<void>(`${this.endpoint}/${notificationId}/mark-read`);
    return { data: undefined, status: 'success' };
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    await apiClient.post<void>(`${this.endpoint}/mark-all-read`);
    return { data: undefined, status: 'success' };
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const data = await apiClient.get<{ count: number }>(`${this.endpoint}/unread-count`);
    return { data, status: 'success' };
  }
}

export const notificationService = new NotificationService();