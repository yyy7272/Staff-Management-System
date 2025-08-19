import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { employeeService, departmentService } from '../services';
import type { Employee, Department, FilterOptions, LoadingState, FormErrors } from '../types/common';
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '../types/api';
import { createEmployeeValidator } from '../utils/validation';

export const useEmployeeData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const statistics = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    onLeave: employees.filter(e => e.status === "on-leave").length,
    inactive: employees.filter(e => e.status === "inactive").length,
  }), [employees]);

  const departmentNames = useMemo(() => 
    Array.from(new Set(employees.map(emp => 
      typeof emp.department === 'object' ? emp.department.name : emp.department
    ))), 
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = !filters.search || 
        employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.position.toLowerCase().includes(filters.search.toLowerCase());
      
      const employeeDeptName = typeof employee.department === 'object' ? employee.department.name : employee.department;
      const matchesDepartment = filters.department === 'all' || 
        employeeDeptName === filters.department;
      
      const matchesStatus = filters.status === 'all' || 
        employee.status === filters.status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, filters]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  }, []);

  const fetchEmployees = useCallback(async (searchFilters?: FilterOptions) => {
    try {
      setLoadingState('loading');
      const response = await employeeService.getAll(searchFilters || filters);
      setEmployees(response.data);
      setLoadingState('success');
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to load employees');
      console.error('Error fetching employees:', error);
    }
  }, [filters]);

  const createEmployee = useCallback(async (data: EmployeeCreateRequest): Promise<{ success: boolean; errors?: FormErrors<EmployeeCreateRequest> }> => {
    const errors = validator.validatePartial(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    try {
      setLoadingState('loading');
      const response = await employeeService.create(data);
      setEmployees(prev => [...prev, response.data]);
      setLoadingState('success');
      toast.success(`Employee ${data.name} added successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to add employee');
      console.error('Error creating employee:', error);
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
      const response = await employeeService.update(id, data);
      setEmployees(prev => prev.map(emp => emp.id === id ? response.data : emp));
      setLoadingState('success');
      toast.success(`Employee ${data.name} updated successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to update employee');
      console.error('Error updating employee:', error);
      return { success: false };
    }
  }, [validator]);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await employeeService.delete(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setSelectedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setLoadingState('success');
      toast.success('Employee deleted successfully');
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to delete employee');
      console.error('Error deleting employee:', error);
      return false;
    }
  }, []);

  const bulkDeleteEmployees = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await employeeService.bulkDelete(ids);
      setEmployees(prev => prev.filter(emp => !ids.includes(emp.id)));
      setSelectedEmployees(new Set());
      setLoadingState('success');
      toast.success(`Successfully deleted ${ids.length} employees`);
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Bulk delete failed');
      console.error('Error bulk deleting employees:', error);
      return false;
    }
  }, []);

  const exportEmployees = useCallback(async (exportFilters?: FilterOptions): Promise<void> => {
    try {
      const blob = await employeeService.export(exportFilters || filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Employee data exported successfully');
    } catch (error) {
      toast.error('Export failed');
      console.error('Error exporting employees:', error);
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
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    statistics,
    departments,
    departmentNames,
    loadingState,
    filters,
    selectedEmployees,
    setFilters,
    fetchEmployees,
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