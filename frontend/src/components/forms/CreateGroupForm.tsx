import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardContent } from '../ui/card';
import { userService } from '../../services/userService';
import type { CreateGroupRequest } from '../../types/group';
import type { User } from '../../types/common';

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupRequest) => void;
  onCancel: () => void;
}

export const CreateGroupForm: React.FC<CreateGroupFormProps> = ({ onSubmit, onCancel }) => {
  const [users, setEmployees] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateGroupRequest>({
    defaultValues: {
      type: 'project',
      visibility: 'private',
      maxMembers: 50,
      allowFileSharing: true,
      allowMemberInvite: false,
      initialMembers: []
    }
  });

  const watchType = watch('type');
  const watchVisibility = watch('visibility');
  const watchAllowFileSharing = watch('allowFileSharing');
  const watchAllowMemberInvite = watch('allowMemberInvite');

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await userService.getAll();
        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  const handleFormSubmit = (data: CreateGroupRequest) => {
    onSubmit({
      ...data,
      initialMembers: selectedMembers
    });
  };

  const toggleMember = (employeeId: string) => {
    setSelectedMembers(prev => {
      const newMembers = prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId];
      setValue('initialMembers', newMembers);
      return newMembers;
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Group Name *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Group name is required' })}
            placeholder="Enter group name"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter group description"
            rows={3}
          />
        </div>
      </div>

      {/* Group Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Group Type</Label>
          <Select
            value={watchType}
            onValueChange={(value) => setValue('type', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={watchVisibility}
            onValueChange={(value) => setValue('visibility', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="department">Department Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="maxMembers">Maximum Members</Label>
        <Input
          id="maxMembers"
          type="number"
          min="1"
          max="1000"
          {...register('maxMembers', {
            required: 'Maximum members is required',
            min: { value: 1, message: 'Must be at least 1' },
            max: { value: 1000, message: 'Cannot exceed 1000' }
          })}
        />
        {errors.maxMembers && (
          <p className="text-sm text-red-600 mt-1">{errors.maxMembers.message}</p>
        )}
      </div>

      {/* Permissions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Permissions</h3>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="allowFileSharing" className="text-sm font-medium">
              Allow File Sharing
            </Label>
            <p className="text-xs text-gray-600">
              Members can upload and share files within this group
            </p>
          </div>
          <Switch
            id="allowFileSharing"
            checked={watchAllowFileSharing}
            onCheckedChange={(checked) => setValue('allowFileSharing', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="allowMemberInvite" className="text-sm font-medium">
              Allow Member Invites
            </Label>
            <p className="text-xs text-gray-600">
              Members can invite others to join this group
            </p>
          </div>
          <Switch
            id="allowMemberInvite"
            checked={watchAllowMemberInvite}
            onCheckedChange={(checked) => setValue('allowMemberInvite', checked)}
          />
        </div>
      </div>

      {/* Initial Members */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Initial Members</h3>
          <span className="text-sm text-gray-600">
            {selectedMembers.length} selected
          </span>
        </div>

        {loadingEmployees ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <Card className="max-h-64 overflow-y-auto">
            <CardContent className="p-2">
              <div className="space-y-2">
                {users.map((User) => (
                  <div
                    key={User.id}
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMembers.includes(User.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleMember(User.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(User.id)}
                      onChange={() => toggleMember(User.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{User.name}</div>
                      <div className="text-xs text-gray-600">
                        {User.position} • {User.department?.name || 'No Department'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </form>
  );
};