import { useState, useEffect } from 'react';
import { userService } from '../services';

interface TrendData {
  value: number;
  isPositive: boolean;
  text: string;
}

interface Statistics {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  trends?: {
    totalEmployeesTrend?: TrendData;
    activeEmployeesTrend?: TrendData;
  };
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    onLeave: 0,
    inactive: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await userService.getStatistics();
        setStatistics(response.data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error fetching statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, isLoading, error };
};