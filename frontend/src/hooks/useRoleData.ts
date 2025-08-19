import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { roleService } from '../services';
import type { Role, LoadingState } from '../types/common';

export const useRoleData = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  const fetchRoles = useCallback(async () => {
    try {
      setLoadingState('loading');
      const response = await roleService.getAll();
      setRoles(response.data);
      setLoadingState('success');
    } catch (error: any) {
      setLoadingState('error');
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  }, []);


  const createRole = useCallback(async (data: any): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await roleService.create(data);
      await fetchRoles();
      setLoadingState('success');
      toast.success('Role created successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      toast.error('Failed to create role');
      console.error('Error creating role:', error);
      return { success: false };
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (id: string, data: any): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await roleService.update(id, data);
      await fetchRoles();
      setLoadingState('success');
      toast.success('Role updated successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      toast.error('Failed to update role');
      console.error('Error updating role:', error);
      return { success: false };
    }
  }, [fetchRoles]);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await roleService.delete(id);
      setRoles(prev => prev.filter(role => role.id !== id));
      setLoadingState('success');
      toast.success('Role deleted successfully');
      return true;
    } catch (error: any) {
      setLoadingState('error');
      toast.error('Failed to delete role');
      console.error('Error deleting role:', error);
      return false;
    }
  }, []);




  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loadingState,
    isLoading: loadingState === 'loading',
    fetchRoles,
    createRole,
    updateRole,
    deleteRole
  };
};