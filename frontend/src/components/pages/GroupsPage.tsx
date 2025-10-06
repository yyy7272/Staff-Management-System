import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { groupService } from '../../services/groupService';
import type { Group } from '../../types/group';
import { CreateGroupForm } from '../forms/CreateGroupForm';
import { ManageGroupMembersForm } from '../forms/ManageGroupMembersForm';
import { GroupCard } from '../common/GroupCard';
import { toast } from 'sonner';

export const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || group.type === typeFilter;
    const matchesVisibility = visibilityFilter === 'all' || group.visibility === visibilityFilter;
    return matchesSearch && matchesType && matchesVisibility;
  });

  const handleCreateGroup = async (groupData: any) => {
    try {
      await groupService.createGroup(groupData);
      await loadGroups();
      setIsCreateDialogOpen(false);
      toast.success('Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await groupService.deleteGroup(groupId);
      await loadGroups();
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setIsMembersDialogOpen(true);
  };

  const handleMembersUpdated = () => {
    loadGroups();
  };

  const getTypeColor = (type: string) => {
    const colors = {
      project: 'bg-blue-100 text-blue-800',
      department: 'bg-green-100 text-green-800',
      company: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.custom;
  };

  const getVisibilityColor = (visibility: string) => {
    const colors = {
      public: 'bg-green-100 text-green-800',
      private: 'bg-red-100 text-red-800',
      department: 'bg-yellow-100 text-yellow-800'
    };
    return colors[visibility as keyof typeof colors] || colors.private;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-2">Manage and collaborate with teams</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <CreateGroupForm onSubmit={handleCreateGroup} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Manage Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Group Members - {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <ManageGroupMembersForm
              group={selectedGroup}
              onClose={() => setIsMembersDialogOpen(false)}
              onMembersUpdated={handleMembersUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="project">Project</option>
            <option value="department">Department</option>
            <option value="company">Company</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="department">Department</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Groups Grid/List */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' || visibilityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first group to get started'}
          </p>
          {!searchTerm && typeFilter === 'all' && visibilityFilter === 'all' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={() => handleDeleteGroup(group.id)}
              onManageMembers={handleManageMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
};