import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../lib/apiClient';
import { apiEndpoints } from '../config/environment';
import type { LoadingState } from '../types/common';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  isAdministrator: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  // Page access permissions
  canAccessUsers?: boolean;
  canAccessOrganization?: boolean;
  canManageOrganization?: boolean;
  canAccessPayroll?: boolean;
  canManagePayroll?: boolean;
  canAccessApprovals?: boolean;
  canManageApprovals?: boolean;
  canAccessPermissions?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roles?: string[];
  // Avatar fields
  profileImageUrl?: string;
  thumbnailImageUrl?: string;
}

interface UsersResponse {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const useUserData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingState('loading');
      console.log('Fetching users from:', '/admin/users');
      console.log('Current token:', localStorage.getItem('authToken') ? 'exists' : 'missing');
      
      const response = await apiClient.get<UsersResponse>('/admin/users');
      console.log('Users response:', response);
      
      setUsers(response.users);
      setTotalCount(response.totalCount);
      setLoadingState('success');
    } catch (error: any) {
      setLoadingState('error');
      console.error('Error fetching users:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: typeof error,
        name: error.name
      });
      toast.error('Failed to load users');
    }
  }, []);

  const updateUserPermissions = useCallback(async (userId: string, permissions: any): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await apiClient.put(`/admin/users/${userId}/permissions`, permissions);
      await fetchUsers();
      setLoadingState('success');
      toast.success('User permissions updated successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      toast.error('Failed to update user permissions');
      console.error('Error updating user permissions:', error);
      return { success: false };
    }
  }, [fetchUsers]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await apiClient.patch(`/admin/users/${userId}/toggle-status`);
      await fetchUsers();
      setLoadingState('success');
      toast.success('User status updated successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
      return { success: false };
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    totalCount,
    loadingState,
    isLoading: loadingState === 'loading',
    fetchUsers,
    updateUserPermissions,
    toggleUserStatus
  };
};