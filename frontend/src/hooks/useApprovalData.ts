import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { approvalService } from '../services';
import type { ApprovalItem, FilterOptions, LoadingState, FormErrors } from '../types/common';
import type { ApprovalCreateRequest, ApprovalActionRequest } from '../types/api';
import { createApprovalValidator } from '../utils/validation';

export const useApprovalData = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    status: 'all',
    priority: 'all'
  });

  const validator = useMemo(() => createApprovalValidator(), []);

  const filteredApprovals = useMemo(() => {
    return approvals.filter(approval => {
      const matchesSearch = !filters.search ||
        approval.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        approval.applicant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        approval.description.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = filters.type === 'all' || approval.type === filters.type;
      const matchesStatus = filters.status === 'all' || approval.status === filters.status;
      const matchesPriority = filters.priority === 'all' || approval.priority === filters.priority;
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [approvals, filters]);

  const pendingApprovals = useMemo(() => 
    approvals.filter(a => a.status === 'pending'), 
    [approvals]
  );

  const myApprovals = useMemo(() => {
    // Get current user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const currentUsername = currentUser?.username || '';
      
      return approvals.filter(a => 
        a.applicant.name === currentUsername || 
        a.applicant.name === currentUser?.firstName || 
        a.applicant.name === 'admin' // fallback for admin user
      );
    } catch {
      return approvals.filter(a => a.applicant.name === 'admin'); // fallback
    }
  }, [approvals]);

  const statistics = useMemo(() => ({
    pending: pendingApprovals.length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    myTotal: myApprovals.length
  }), [approvals, pendingApprovals, myApprovals]);

  const fetchApprovals = useCallback(async (searchFilters?: FilterOptions) => {
    try {
      setLoadingState('loading');
      const response = await approvalService.getAll(searchFilters || filters);
      setApprovals(response.data);
      setLoadingState('success');
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to load approvals');
      console.error('Error fetching approvals:', error);
    }
  }, [filters]);

  const createApproval = useCallback(async (data: ApprovalCreateRequest): Promise<{ success: boolean; errors?: FormErrors<ApprovalCreateRequest> }> => {
    const errors = validator.validate(data);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    try {
      setLoadingState('loading');
      const response = await approvalService.create(data);
      setApprovals(prev => [response.data, ...prev]);
      setLoadingState('success');
      toast.success(`Application ${data.title} submitted successfully`);
      return { success: true };
    } catch (error) {
      setLoadingState('error');
      toast.error('Failed to submit application');
      console.error('Error creating approval:', error);
      return { success: false };
    }
  }, [validator]);

  const processApprovalAction = useCallback(async (id: string, actionData: ApprovalActionRequest): Promise<boolean> => {
    try {
      setLoadingState('loading');
      const response = await approvalService.processAction(id, actionData);
      setApprovals(prev => prev.map(approval => 
        approval.id === id ? response.data : approval
      ));
      setLoadingState('success');
      toast.success(`Application ${actionData.action === 'approve' ? 'approved' : 'rejected'}`);
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Operation failed');
      console.error('Error processing approval action:', error);
      return false;
    }
  }, []);

  const cancelApproval = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingState('loading');
      const response = await approvalService.cancel(id);
      setApprovals(prev => prev.map(approval => 
        approval.id === id ? response.data : approval
      ));
      setLoadingState('success');
      toast.success('Application cancelled');
      return true;
    } catch (error) {
      setLoadingState('error');
      toast.error('Cancellation failed');
      console.error('Error cancelling approval:', error);
      return false;
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await approvalService.getStatistics();
      return response.data;
    } catch (error) {
      console.error('Error fetching approval statistics:', error);
      return null;
    }
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const types = {
      leave: "Leave",
      expense: "Expense", 
      purchase: "Purchase",
      other: "Other"
    };
    return types[type as keyof typeof types] || "Unknown";
  }, []);

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount

  return {
    approvals: filteredApprovals,
    allApprovals: approvals,
    pendingApprovals,
    myApprovals,
    statistics,
    loadingState,
    filters,
    setFilters,
    fetchApprovals,
    createApproval,
    processApprovalAction,
    cancelApproval,
    fetchStatistics,
    getTypeLabel,
    isLoading: loadingState === 'loading'
  };
};