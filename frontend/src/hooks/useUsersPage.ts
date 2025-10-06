import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { userService, departmentService } from '../services';
import type { User, Department, FilterOptions, LoadingState, FormErrors } from '../types/common';
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '../types/api';
import { createEmployeeValidator } from '../utils/validation';

export const useUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    department: 'all',
    status: 'all',
    page: 1,
    limit: 10
  });
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  const validator = useMemo(() => createEmployeeValidator(), []);

  const statistics = useMemo(() => {
    const employeeArray = Array.isArray(users) ? users : [];
    return {
      total: employeeArray.length,
      active: employeeArray.filter(e => e.status === "active").length,
      onLeave: employeeArray.filter(e => e.status === "on-leave").length,
      inactive: employeeArray.filter(e => e.status === "inactive").length,
    };
  }, [users]);

  const departmentNames = useMemo(() => {
    const employeeArray = Array.isArray(users) ? users : [];
    return Array.from(new Set(employeeArray.map(emp =>
      typeof emp.department === 'object' ? emp.department.name : emp.department
    )));
  }, [users]);

  const filteredEmployees = useMemo(() => {
    const employeeArray = Array.isArray(users) ? users : [];
    return employeeArray.filter(User => {
      const matchesSearch = !filters.search || 
        User.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        User.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        User.position.toLowerCase().includes(filters.search.toLowerCase());
      
      const employeeDeptName = typeof User.department === 'object' ? User.department.name : User.department;
      const matchesDepartment = filters.department === 'all' || 
        employeeDeptName === filters.department;
      
      const matchesStatus = filters.status === 'all' || 
        User.status === filters.status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [users, filters]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  }, []);

  const fetchUsers = useCallback(async (searchFilters?: FilterOptions) => {
    try {
      setLoadingState('loading');
      const response = await userService.getAll(searchFilters || filters);
      setUsers(response.data);
      setLoadingState('success');
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    }
  }, [filters]);

  const createEmployee = useCallback(async (data: EmployeeCreateRequest): Promise<{ success: boolean; errors?: FormErrors<EmployeeCreateRequest> }> => {
    const errors = validator.validatePartial(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    try {
      setLoadingState('loading');
      const response = await userService.create(data);
      setUsers(prev => [...(Array.isArray(prev) ? prev : []), response.data]);
      setLoadingState('success');
      toast.success(`User ${data.name} added successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to add User');
      console.error('Error creating User:', error);
      return { success: false };
    }
  }, [validator]);

  const updateEmployee = useCallback(async (id: string, data: EmployeeUpdateRequest): Promise<{ success: boolean; errors?: FormErrors<EmployeeUpdateRequest> }> => {
    const errors = validator.validatePartial(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    try {
      setLoadingState('loading');
      const response = await userService.update(id, data);
      setUsers(prev => Array.isArray(prev) ? prev.map(emp => emp.id === id ? response.data : emp) : [response.data]);
      setLoadingState('success');
      toast.success(`User ${data.name} updated successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to update User');
      console.error('Error updating User:', error);
      return { success: false };
    }
  }, [validator]);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await userService.delete(id);
      setUsers(prev => Array.isArray(prev) ? prev.filter(emp => emp.id !== id) : []);
      setSelectedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setLoadingState('success');
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to delete User');
      console.error('Error deleting User:', error);
      return false;
    }
  }, []);

  const bulkDeleteEmployees = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await userService.bulkDelete(ids);
      setUsers(prev => Array.isArray(prev) ? prev.filter(emp => !ids.includes(emp.id)) : []);
      setSelectedEmployees(new Set());
      setLoadingState('success');
      toast.success(`Successfully deleted ${ids.length} users`);
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Bulk delete failed');
      console.error('Error bulk deleting users:', error);
      return false;
    }
  }, []);

  const exportEmployees = useCallback(async (exportFilters?: FilterOptions): Promise<void> => {
    try {
      const blob = await userService.export(exportFilters || filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('User data exported successfully');
    } catch (error) {
      toast.error('Export failed');
      console.error('Error exporting users:', error);
    }
  }, [filters]);

  const handleSelectEmployee = useCallback((employeeId: string, checked: boolean) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(employeeId);
      } else {
        newSet.delete(employeeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(filteredEmployees.map(e => e.id)));
    } else {
      setSelectedEmployees(new Set());
    }
  }, [filteredEmployees]);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  return {
    users: filteredEmployees,
    allUsers: users,
    statistics,
    departments,
    departmentNames,
    loadingState,
    filters,
    selectedEmployees,
    setFilters,
    fetchUsers,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkDeleteEmployees,
    exportEmployees,
    handleSelectEmployee,
    handleSelectAll,
    isLoading: loadingState === 'loading'
  };
};