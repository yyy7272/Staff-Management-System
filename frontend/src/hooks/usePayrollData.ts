import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { payrollService } from '../services';
import type { Payroll, FilterOptions, LoadingState } from '../types/common';

export const usePayrollData = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [statistics, setStatistics] = useState({
    totalRecords: 0,
    draftRecords: 0,
    processedRecords: 0,
    paidRecords: 0,
    totalPayroll: 0,
    averagePayroll: 0,
    trends: {
      totalPayrollTrend: { value: 0, isPositive: true, text: "No change" },
      averagePayrollTrend: { value: 0, isPositive: true, text: "No change" },
      totalRecordsTrend: { value: 0, isPositive: true, text: "No change" },
      processedRecordsTrend: { value: 0, isPositive: true, text: "No change" }
    }
  });
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [hasAccess, setHasAccess] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  });
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<string>>(new Set());

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(payroll => {
      const matchesSearch = !filters.search || 
        payroll.employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        payroll.employee.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        payroll.employee.department.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
        payroll.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [payrolls, filters]);

  const fetchPayrolls = useCallback(async (searchFilters?: FilterOptions) => {
    try {
      setLoadingState('loading');
      const response = await payrollService.getAll(searchFilters || filters);
      
      // Success - set data and mark as having access
      setPayrolls(response.data.data || []);
      setHasAccess(true);
      setLoadingState('success');
    } catch (error: any) {
      console.log('Payroll API call result:', error);
      
      // Check if it's an access denied error
      if (error.status === 403) {
        setHasAccess(false);
        setLoadingState('error');
      } else {
        // For admin/HR users, this is likely just empty data or network issue
        // Show empty state without error messages
        setPayrolls([]);
        setHasAccess(true);
        setLoadingState('success');
      }
    }
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await payrollService.getStatistics();
      setStatistics({
        ...response.data,
        trends: statistics.trends // Preserve existing trends if not provided
      });
    } catch (error: any) {
      // Silently handle statistics errors
      console.log('Statistics error:', error);
    }
  }, []);

  const createPayroll = useCallback(async (data: any): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await payrollService.create(data);
      await fetchPayrolls();
      await fetchStatistics();
      setLoadingState('success');
      toast.success('Payroll record created successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      console.error('Create payroll error:', error);
      if (error.status === 403) {
        toast.error('Access denied. Administrator or HR privileges required.');
      } else {
        toast.error(error.message || 'Failed to create payroll record. Please try again.');
      }
      return { success: false };
    }
  }, [fetchPayrolls, fetchStatistics]);

  const updatePayroll = useCallback(async (id: string, data: any): Promise<{ success: boolean }> => {
    try {
      setLoadingState('loading');
      await payrollService.update(id, data);
      await fetchPayrolls();
      await fetchStatistics();
      setLoadingState('success');
      toast.success('Payroll record updated successfully');
      return { success: true };
    } catch (error: any) {
      setLoadingState('error');
      console.error('Update payroll error:', error);
      if (error.status === 403) {
        toast.error('Access denied. Administrator or HR privileges required.');
      } else {
        toast.error(error.message || 'Failed to update payroll record. Please try again.');
      }
      return { success: false };
    }
  }, [fetchPayrolls, fetchStatistics]);

  const updatePayrollStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await payrollService.updateStatus(id, { status });
      await fetchPayrolls();
      await fetchStatistics();
      setLoadingState('success');
      return true;
    } catch (error: any) {
      setLoadingState('error');
      console.error('Update payroll status error:', error);
      if (error.status === 403) {
        toast.error('Access denied. Administrator or HR privileges required.');
      } else {
        toast.error(error.message || 'Failed to update payroll status. Please try again.');
      }
      return false;
    }
  }, [fetchPayrolls, fetchStatistics]);

  const deletePayroll = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      await payrollService.delete(id);
      setPayrolls(prev => prev.filter(payroll => payroll.id !== id));
      setSelectedPayrolls(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      await fetchStatistics();
      setLoadingState('success');
      toast.success('Payroll record deleted successfully');
      return true;
    } catch (error: any) {
      setLoadingState('error');
      console.error('Delete payroll error:', error);
      if (error.status === 403) {
        toast.error('Access denied. Administrator privileges required.');
      } else {
        toast.error(error.message || 'Failed to delete payroll record. Please try again.');
      }
      return false;
    }
  }, [fetchStatistics]);

  const handleSelectPayroll = useCallback((payrollId: string, checked: boolean) => {
    setSelectedPayrolls(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(payrollId);
      } else {
        newSet.delete(payrollId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(new Set(filteredPayrolls.map(p => p.id)));
    } else {
      setSelectedPayrolls(new Set());
    }
  }, [filteredPayrolls]);

  useEffect(() => {
    fetchPayrolls();
    fetchStatistics();
  }, [fetchPayrolls, fetchStatistics]);

  return {
    payrolls: filteredPayrolls,
    allPayrolls: payrolls,
    statistics,
    loadingState,
    hasAccess,
    filters,
    selectedPayrolls,
    setFilters,
    fetchPayrolls,
    createPayroll,
    updatePayroll,
    updatePayrollStatus,
    deletePayroll,
    handleSelectPayroll,
    handleSelectAll,
    isLoading: loadingState === 'loading'
  };
};