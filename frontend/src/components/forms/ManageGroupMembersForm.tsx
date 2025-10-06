import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search, UserPlus, UserMinus, Crown } from 'lucide-react';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import type { User } from '../../types/common';
import type { Group, GroupMember } from '../../types/group';
import { toast } from 'sonner';

interface ManageGroupMembersFormProps {
  group: Group;
  onClose: () => void;
  onMembersUpdated: () => void;
}

export const ManageGroupMembersForm: React.FC<ManageGroupMembersFormProps> = ({
  group,
  onClose,
  onMembersUpdated
}) => {
  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingMembers, setAddingMembers] = useState<string[]>([]);
  const [removingMembers, setRemovingMembers] = useState<string[]>([]);

  useEffect(() => {
    loadGroupMembers();
    loadAvailableEmployees();
  }, [group.id]);

  const loadGroupMembers = async () => {
    try {
      const members = await groupService.getGroupMembers(group.id);
      setCurrentMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
      toast.error('Failed to load group members');
    }
  };

  const loadAvailableEmployees = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setAvailableEmployees(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableEmployees = availableEmployees.filter(User => {
    const isNotMember = !currentMembers.some(member => member.employeeId === User.id);
    const matchesSearch = User.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         User.email.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotMember && matchesSearch;
  });

  const handleAddMember = async (employeeId: string) => {
    setAddingMembers(prev => [...prev, employeeId]);
    try {
      await groupService.addGroupMember(group.id, {
        employeeId,
        role: 'member'
      });
      await loadGroupMembers();
      onMembersUpdated();
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setAddingMembers(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) return;

    setRemovingMembers(prev => [...prev, memberId]);
    try {
      await groupService.removeGroupMember(group.id, memberId);
      await loadGroupMembers();
      onMembersUpdated();
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setRemovingMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await groupService.updateGroupMemberRole(group.id, memberId, { role: newRole });
      await loadGroupMembers();
      onMembersUpdated();
      toast.success(`Member role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Members ({currentMembers.length}/{group.maxMembers})</span>
            <Badge variant="outline">
              {group.currentMemberCount} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentMembers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No members in this group yet.</p>
          ) : (
            currentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.employeeAvatar} />
                    <AvatarFallback>
                      {member.employeeName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.employeeName}
                      {member.role === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.employeePosition} • {member.employeeDepartment}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                    {member.role}
                  </Badge>
                  <div className="flex space-x-1">
                    {member.role === 'member' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateMemberRole(member.id, 'admin')}
                      >
                        Make Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateMemberRole(member.id, 'member')}
                      >
                        Remove Admin
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingMembers.includes(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {removingMembers.includes(member.id) ? (
                        'Removing...'
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add New Members */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Members</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAvailableEmployees.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              {searchTerm ? 'No users found matching your search.' : 'All users are already members of this group.'}
            </p>
          ) : (
            filteredAvailableEmployees.map((User) => (
              <div key={User.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {User.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{User.name}</div>
                    <div className="text-sm text-gray-600">
                      {User.position} • {User.department?.name || 'No Department'}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddMember(User.id)}
                  disabled={addingMembers.includes(User.id) || currentMembers.length >= group.maxMembers}
                >
                  {addingMembers.includes(User.id) ? (
                    'Adding...'
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};