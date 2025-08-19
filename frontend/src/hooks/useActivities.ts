import { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import type { Activity } from '../types/common';

export function useActivities(count: number = 10) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await activityService.getRecentActivities(count);
      setActivities(response.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to load recent activities');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [count]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities
  };
}