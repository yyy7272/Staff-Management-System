import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { departmentService } from '../services';
import type { Department, LoadingState, FormErrors } from '../types/common';
import type { DepartmentCreateRequest, DepartmentUpdateRequest } from '../types/api';
import { createDepartmentValidator } from '../utils/validation';

export const useDepartmentData = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const validator = useMemo(() => createDepartmentValidator(), []);

  const allDepartments = useMemo(() => {
    const flattenDepts = (depts: Department[]): Department[] => {
      return depts.reduce((acc, dept) => {
        acc.push(dept);
        if (dept.children) {
          acc.push(...flattenDepts(dept.children));
        }
        return acc;
      }, [] as Department[]);
    };
    return flattenDepts(departments);
  }, [departments]);

  const statistics = useMemo(() => {
    const totalDepts = allDepartments.length;
    const parentDepts = departments.length;
    const childDepts = allDepartments.filter(d => d.parentId).length;
    const totalEmployees = allDepartments.reduce((sum, dept) => sum + dept.employeeCount, 0);
    
    return { totalDepts, parentDepts, childDepts, totalEmployees };
  }, [allDepartments, departments]);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingState('loading');
      const response = await departmentService.getAll();
      setDepartments(response.data);
      setLoadingState('success');
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to load departments');
      console.error('Error fetching departments:', error);
    }
  }, []);

  const createDepartment = useCallback(async (data: DepartmentCreateRequest): Promise<{ success: boolean; errors?: FormErrors<DepartmentCreateRequest> }> => {
    const errors = validator.validatePartial(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Check for duplicate names
    if (allDepartments.some(d => d.name === data.name)) {
      return { success: false, errors: { name: 'Department name already exists' } };
    }

    try {
      setLoadingState('loading');
      const response = await departmentService.create(data);
      
      // Add to tree structure
      setDepartments(prev => addDepartmentToTree(prev, response.data, data.parentId));
      setLoadingState('success');
      toast.success(`Department ${data.name} added successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to add department');
      console.error('Error creating department:', error);
      return { success: false };
    }
  }, [validator, allDepartments]);

  const updateDepartment = useCallback(async (id: string, data: Partial<DepartmentUpdateRequest>): Promise<{ success: boolean; errors?: FormErrors<DepartmentUpdateRequest> }> => {
    const errors = validator.validatePartial(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Check for duplicate names (excluding current department)
    if (data.name && allDepartments.some(d => d.name === data.name && d.id !== id)) {
      return { success: false, errors: { name: 'Department name already exists' } };
    }

    try {
      setLoadingState('loading');
      const response = await departmentService.update(id, data);
      
      setDepartments(prev => updateDepartmentInTree(prev, id, response.data));
      setLoadingState('success');
      toast.success(`Department ${data.name} updated successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to update department');
      console.error('Error updating department:', error);
      return { success: false };
    }
  }, [validator, allDepartments]);

  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await departmentService.delete(id);
      
      setDepartments(prev => removeDepartmentFromTree(prev, id));
      setLoadingState('success');
      toast.success('Department deleted successfully');
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to delete department');
      console.error('Error deleting department:', error);
      return false;
    }
  }, []);

  const toggleDepartment = useCallback((deptId: string) => {
    setExpandedDepts(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(deptId)) {
        newExpanded.delete(deptId);
      } else {
        newExpanded.add(deptId);
      }
      return newExpanded;
    });
  }, []);

  const findDepartmentById = useCallback((id: string): Department | null => {
    const findInTree = (depts: Department[]): Department | null => {
      for (const dept of depts) {
        if (dept.id === id) return dept;
        if (dept.children) {
          const found = findInTree(dept.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInTree(departments);
  }, [departments]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await departmentService.getStatistics();
      return response.data;
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    allDepartments,
    statistics,
    expandedDepts,
    loadingState,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartment,
    findDepartmentById,
    fetchStatistics,
    isLoading: loadingState === 'loading'
  };
};

// Helper functions for tree operations
const updateDepartmentInTree = (depts: Department[], targetId: string, updates: Partial<Department>): Department[] => {
  return depts.map(dept => {
    if (dept.id === targetId) {
      return { ...dept, ...updates };
    }
    if (dept.children) {
      return {
        ...dept,
        children: updateDepartmentInTree(dept.children, targetId, updates)
      };
    }
    return dept;
  });
};

const removeDepartmentFromTree = (depts: Department[], targetId: string): Department[] => {
  return depts.filter(dept => dept.id !== targetId).map(dept => {
    if (dept.children) {
      return {
        ...dept,
        children: removeDepartmentFromTree(dept.children, targetId)
      };
    }
    return dept;
  });
};

const addDepartmentToTree = (depts: Department[], newDept: Department, parentId?: string): Department[] => {
  if (!parentId) {
    return [...depts, newDept];
  }
  
  return depts.map(dept => {
    if (dept.id === parentId) {
      return {
        ...dept,
        children: [...(dept.children || []), newDept]
      };
    }
    if (dept.children) {
      return {
        ...dept,
        children: addDepartmentToTree(dept.children, newDept, parentId)
      };
    }
    return dept;
  });
};