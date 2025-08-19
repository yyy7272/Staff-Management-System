import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { employeeService } from '../employeeService';

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getWithParams: vi.fn(),
};

vi.mock('../lib/apiClient', () => ({
  apiClient: mockApiClient,
}));

describe('EmployeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all employees without filters', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };

      mockApiClient.getWithParams.mockResolvedValueOnce(mockResponse);

      const result = await employeeService.getAll();

      expect(mockApiClient.getWithParams).toHaveBeenCalledWith('/Employee', undefined);
      expect(result).toEqual({
        data: mockResponse,
        status: 'success',
      });
    });

    it('should fetch employees with filters', async () => {
      const filters = {
        search: 'John',
        status: 'active',
        departmentId: '123',
        page: 2,
        limit: 5,
      };

      const mockResponse = {
        data: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
        pagination: { page: 2, limit: 5, total: 1, totalPages: 1 },
      };

      mockApiClient.getWithParams.mockResolvedValueOnce(mockResponse);

      const result = await employeeService.getAll(filters);

      expect(mockApiClient.getWithParams).toHaveBeenCalledWith('/Employee', filters);
      expect(result).toEqual({
        data: mockResponse,
        status: 'success',
      });
    });
  });

  describe('getById', () => {
    it('should fetch employee by id', async () => {
      const employeeId = '123';
      const mockEmployee = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        position: 'Developer',
      };

      mockApiClient.get.mockResolvedValueOnce(mockEmployee);

      const result = await employeeService.getById(employeeId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/Employee/${employeeId}`);
      expect(result).toEqual({
        data: mockEmployee,
        status: 'success',
      });
    });
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        position: 'Developer',
        departmentId: '123',
        salary: 75000,
      };

      const mockCreatedEmployee = {
        id: '456',
        ...employeeData,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.post.mockResolvedValueOnce(mockCreatedEmployee);

      const result = await employeeService.create(employeeData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/Employee', employeeData);
      expect(result).toEqual({
        data: mockCreatedEmployee,
        status: 'success',
      });
    });
  });

  describe('update', () => {
    it('should update an existing employee', async () => {
      const employeeId = '123';
      const updateData = {
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        position: 'Senior Developer',
      };

      const mockUpdatedEmployee = {
        id: employeeId,
        ...updateData,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.put.mockResolvedValueOnce(mockUpdatedEmployee);

      const result = await employeeService.update(employeeId, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/Employee/${employeeId}`, updateData);
      expect(result).toEqual({
        data: mockUpdatedEmployee,
        status: 'success',
      });
    });
  });

  describe('delete', () => {
    it('should delete an employee', async () => {
      const employeeId = '123';

      mockApiClient.delete.mockResolvedValueOnce(undefined);

      const result = await employeeService.delete(employeeId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/Employee/${employeeId}`);
      expect(result).toEqual({
        data: undefined,
        status: 'success',
      });
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple employees', async () => {
      const employeeIds = ['123', '456', '789'];

      mockApiClient.post.mockResolvedValueOnce({ deletedCount: 3 });

      const result = await employeeService.bulkDelete(employeeIds);

      expect(mockApiClient.post).toHaveBeenCalledWith('/Employee/bulk-delete', { ids: employeeIds });
      expect(result).toEqual({
        data: { deletedCount: 3 },
        status: 'success',
      });
    });
  });

  describe('exportData', () => {
    it('should export employee data', async () => {
      const filters = { status: 'active' };
      const mockBlob = new Blob(['employee,data'], { type: 'text/csv' });

      mockApiClient.getWithParams.mockResolvedValueOnce(mockBlob);

      const result = await employeeService.exportData(filters);

      expect(mockApiClient.getWithParams).toHaveBeenCalledWith('/Employee/export', filters);
      expect(result).toEqual({
        data: mockBlob,
        status: 'success',
      });
    });
  });

  describe('getStatistics', () => {
    it('should fetch employee statistics', async () => {
      const mockStats = {
        total: 100,
        active: 95,
        inactive: 5,
        byDepartment: [
          { departmentName: 'IT', count: 50 },
          { departmentName: 'HR', count: 25 },
          { departmentName: 'Finance', count: 25 },
        ],
        recentHires: [
          { id: '1', name: 'John Doe', hireDate: '2024-01-01' },
        ],
      };

      mockApiClient.get.mockResolvedValueOnce(mockStats);

      const result = await employeeService.getStatistics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/Employee/statistics');
      expect(result).toEqual({
        data: mockStats,
        status: 'success',
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network error');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      await expect(employeeService.getById('123')).rejects.toThrow('Network error');
    });

    it('should handle API client errors with custom error format', async () => {
      const apiError = {
        message: 'Employee not found',
        status: 404,
        details: 'The requested employee does not exist',
      };
      mockApiClient.get.mockRejectedValueOnce(apiError);

      await expect(employeeService.getById('123')).rejects.toEqual(apiError);
    });
  });
});