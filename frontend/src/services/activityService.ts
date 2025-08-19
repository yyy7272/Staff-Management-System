import { apiClient } from '../lib/apiClient';
import type { Activity, ApiResponse } from '../types/common';

class ActivityService {
  private readonly endpoint = '/home';

  async getRecentActivities(count: number = 10): Promise<ApiResponse<Activity[]>> {
    const data = await apiClient.get<Activity[]>(`${this.endpoint}/recent-activities?count=${count}`);
    return { data, status: 'success' };
  }
}

export const activityService = new ActivityService();