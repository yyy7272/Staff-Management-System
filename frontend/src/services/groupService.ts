import { apiClient } from '../lib/apiClient';
import type {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMember,
  AddGroupMemberRequest,
  UpdateGroupMemberRequest,
  GroupStatistics
} from '../types/group';
import type { ApiResponse } from '../types/api';

export const groupService = {
  // Group CRUD operations
  async getGroups(type?: string, visibility?: string): Promise<Group[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (visibility) params.append('visibility', visibility);

    const response = await apiClient.get(`/api/Group?${params.toString()}`);
    return response.data.data;
  },

  async getGroupById(id: string): Promise<Group> {
    const response = await apiClient.get(`/api/Group/${id}`);
    return response.data.data;
  },

  async createGroup(group: CreateGroupRequest): Promise<Group> {
    const response = await apiClient.post('/api/Group', group);
    return response.data.data;
  },

  async updateGroup(id: string, group: UpdateGroupRequest): Promise<Group> {
    const response = await apiClient.put(`/api/Group/${id}`, group);
    return response.data.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/api/Group/${id}`);
  },

  // Group member management
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response = await apiClient.get(`/api/Group/${groupId}/members`);
    return response.data.data;
  },

  async addMember(groupId: string, member: AddGroupMemberRequest): Promise<void> {
    await apiClient.post(`/api/Group/${groupId}/members`, member);
  },

  async removeMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/api/Group/${groupId}/members/${memberId}`);
  },

  async updateMember(groupId: string, memberId: string, member: UpdateGroupMemberRequest): Promise<void> {
    await apiClient.put(`/api/Group/${groupId}/members/${memberId}`, member);
  },

  // Group discovery
  async getPublicGroups(): Promise<Group[]> {
    const response = await apiClient.get('/api/Group/public');
    return response.data.data;
  },

  async getDepartmentGroups(departmentId: string): Promise<Group[]> {
    const response = await apiClient.get(`/api/Group/department/${departmentId}`);
    return response.data.data;
  },

  async getMyGroups(): Promise<Group[]> {
    const response = await apiClient.get('/api/Group/my-groups');
    return response.data.data;
  },

  // Group actions
  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/api/Group/${groupId}/join`);
  },

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/api/Group/${groupId}/leave`);
  },

  // Group statistics
  async getGroupStatistics(groupId: string): Promise<GroupStatistics> {
    const response = await apiClient.get(`/api/Group/${groupId}/statistics`);
    return response.data.data;
  }
};