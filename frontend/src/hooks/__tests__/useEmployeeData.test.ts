import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeeData } from '../useEmployeeData';

// Mock the employee service
const mockEmployeeService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkDelete: vi.fn(),
  exportData: vi.fn(),
  getStatistics: vi.fn(),
};

vi.mock('../services/index', () => ({
  employeeService: mockEmployeeService,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useEmployeeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useEmployeeData());

    expect(result.current.employees).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('should fetch employees on mount', async () => {
    const mockResponse = {
      data: {
        data: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
      status: 'success',
    };

    mockEmployeeService.getAll.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useEmployeeData());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.employees).toEqual(mockResponse.data.data);
    expect(result.current.pagination).toEqual(mockResponse.data.pagination);
    expect(mockEmployeeService.getAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch employees');
    mockEmployeeService.getAll.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.employees).toEqual([]);
  });

  it('should refetch data when filters change', async () => {
    const mockResponse = {
      data: {
        data: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      status: 'success',
    };

    mockEmployeeService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change filters
    act(() => {
      result.current.setFilters({ search: 'John' });
    });

    await waitFor(() => {
      expect(mockEmployeeService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'John',
      });
    });
  });

  it('should handle page change', async () => {
    const mockResponse = {
      data: {
        data: [],
        pagination: { page: 2, limit: 10, total: 20, totalPages: 2 },
      },
      status: 'success',
    };

    mockEmployeeService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handlePageChange(2);
    });

    await waitFor(() => {
      expect(mockEmployeeService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      });
    });

    expect(result.current.pagination.page).toBe(2);
  });

  it('should handle page size change', async () => {
    const mockResponse = {
      data: {
        data: [],
        pagination: { page: 1, limit: 25, total: 20, totalPages: 1 },
      },
      status: 'success',
    };

    mockEmployeeService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handlePageSizeChange(25);
    });

    await waitFor(() => {
      expect(mockEmployeeService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 25,
      });
    });

    expect(result.current.pagination.limit).toBe(25);
  });

  it('should create employee successfully', async () => {
    const newEmployee = {
      name: 'New Employee',
      email: 'new@example.com',
      position: 'Developer',
    };

    const mockCreatedEmployee = {
      id: '123',
      ...newEmployee,
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockEmployeeService.create.mockResolvedValueOnce({
      data: mockCreatedEmployee,
      status: 'success',
    });

    // Mock refresh call
    mockEmployeeService.getAll.mockResolvedValueOnce({
      data: {
        data: [mockCreatedEmployee],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      status: 'success',
    });

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createEmployee(newEmployee);
    });

    expect(mockEmployeeService.create).toHaveBeenCalledWith(newEmployee);
    expect(mockEmployeeService.getAll).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle create employee error', async () => {
    const newEmployee = {
      name: 'New Employee',
      email: 'new@example.com',
      position: 'Developer',
    };

    const mockError = new Error('Failed to create employee');
    mockEmployeeService.create.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.createEmployee(newEmployee)).rejects.toThrow(
        'Failed to create employee'
      );
    });

    expect(mockEmployeeService.create).toHaveBeenCalledWith(newEmployee);
  });

  it('should update employee successfully', async () => {
    const employeeId = '123';
    const updateData = {
      name: 'Updated Employee',
      email: 'updated@example.com',
    };

    const mockUpdatedEmployee = {
      id: employeeId,
      ...updateData,
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockEmployeeService.update.mockResolvedValueOnce({
      data: mockUpdatedEmployee,
      status: 'success',
    });

    // Mock refresh call
    mockEmployeeService.getAll.mockResolvedValue({
      data: {
        data: [mockUpdatedEmployee],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      status: 'success',
    });

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateEmployee(employeeId, updateData);
    });

    expect(mockEmployeeService.update).toHaveBeenCalledWith(employeeId, updateData);
  });

  it('should delete employee successfully', async () => {
    const employeeId = '123';

    mockEmployeeService.delete.mockResolvedValueOnce({
      data: undefined,
      status: 'success',
    });

    // Mock refresh call
    mockEmployeeService.getAll.mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      status: 'success',
    });

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteEmployee(employeeId);
    });

    expect(mockEmployeeService.delete).toHaveBeenCalledWith(employeeId);
  });

  it('should handle bulk delete successfully', async () => {
    const employeeIds = ['123', '456'];

    mockEmployeeService.bulkDelete.mockResolvedValueOnce({
      data: { deletedCount: 2 },
      status: 'success',
    });

    // Mock refresh call
    mockEmployeeService.getAll.mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      status: 'success',
    });

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkDeleteEmployees(employeeIds);
    });

    expect(mockEmployeeService.bulkDelete).toHaveBeenCalledWith(employeeIds);
  });

  it('should handle refresh manually', async () => {
    const mockResponse = {
      data: {
        data: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      status: 'success',
    };

    mockEmployeeService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployeeData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockEmployeeService.getAll).toHaveBeenCalledTimes(2); // Initial + manual refresh
  });
});