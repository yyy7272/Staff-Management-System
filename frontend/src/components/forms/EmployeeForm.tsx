import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AvatarUpload } from '../common';
import { Loader2 } from 'lucide-react';
import type { Employee } from '../../types/common';
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '../../types/api';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: Partial<Employee>;
  departments: Array<{ id: string; name: string }>;
  onSubmit: (data: EmployeeCreateRequest | EmployeeUpdateRequest) => Promise<{ success: boolean; error?: string }>;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on-leave', label: 'On Leave' }
];

export function EmployeeForm({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
  departments,
  onSubmit
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    position: '',
    department: '',
    hireDate: '',
    salary: 0,
    status: 'active',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [avatarData, setAvatarData] = useState({
    profileImageUrl: '',
    thumbnailImageUrl: ''
  });

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          ...initialData,
          hireDate: initialData.hireDate ? new Date(initialData.hireDate).toISOString().split('T')[0] : ''
        });
        setAvatarData({
          profileImageUrl: initialData.profileImageUrl || '',
          thumbnailImageUrl: initialData.thumbnailImageUrl || ''
        });
      } else {
        setFormData({
          name: '',
          email: '',
          position: '',
          department: '',
          hireDate: '',
          salary: 0,
          status: 'active',
          phone: '',
          address: ''
        });
        setAvatarData({
          profileImageUrl: '',
          thumbnailImageUrl: ''
        });
      }
      setError('');
    }
  }, [isOpen, mode, initialData]);

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.position || !formData.department) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        departmentId: formData.department, // Map department to departmentId for API
        salary: Number(formData.salary) || 0,
        hireDate: formData.hireDate || undefined
      };
      
      // Remove the old department field to avoid confusion
      delete submitData.department;

      const result = await onSubmit(submitData);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to save employee');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUploadSuccess = (profileImageUrl: string, thumbnailImageUrl: string) => {
    setAvatarData({
      profileImageUrl,
      thumbnailImageUrl
    });
    // Optionally refresh the data to get updated employee info
    onSuccess();
  };

  const handleAvatarDelete = () => {
    setAvatarData({
      profileImageUrl: '',
      thumbnailImageUrl: ''
    });
    // Optionally refresh the data
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to add a new employee to the system.' 
              : 'Update the employee information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section - Only show for edit mode with existing employee */}
          {mode === 'edit' && initialData?.id && (
            <div className="flex justify-center">
              <AvatarUpload
                currentImageUrl={avatarData.profileImageUrl}
                employeeId={initialData.id}
                employeeName={formData.name || ''}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={(error) => setError(`Avatar upload failed: ${error}`)}
                onDelete={handleAvatarDelete}
                size="lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter employee name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Enter job position"
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department || ''} 
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hire Date */}
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate || ''}
                onChange={(e) => handleInputChange('hireDate', e.target.value)}
              />
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                min="0"
                value={formData.salary || ''}
                onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || 'active'} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Address - Full width */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              rows={3}
            />
          </div>

          {/* Avatar Upload Note for Create Mode */}
          {mode === 'create' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> You can upload an avatar after creating the employee record.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Employee' : 'Update Employee'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeForm;