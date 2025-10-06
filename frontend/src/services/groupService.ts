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

    const response = await apiClient.get<{ success: boolean; data: Group[] }>(`/Group?${params.toString()}`);
    return response.data;
  },

  async getGroupById(id: string): Promise<Group> {
    const response = await apiClient.get<{ success: boolean; data: Group }>(`/Group/${id}`);
    return response.data;
  },

  async createGroup(group: CreateGroupRequest): Promise<Group> {
    const response = await apiClient.post<{ success: boolean; data: Group }>('/Group', group);
    return response.data;
  },

  async updateGroup(id: string, group: UpdateGroupRequest): Promise<Group> {
    const response = await apiClient.put<{ success: boolean; data: Group }>(`/Group/${id}`, group);
    return response.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/Group/${id}`);
  },

  // Group member management
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response = await apiClient.get<{ success: boolean; data: GroupMember[] }>(`/Group/${groupId}/members`);
    return response.data;
  },

  async addGroupMember(groupId: string, member: AddGroupMemberRequest): Promise<void> {
    await apiClient.post(`/Group/${groupId}/members`, member);
  },

  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/Group/${groupId}/members/${memberId}`);
  },

  async updateGroupMemberRole(groupId: string, memberId: string, member: UpdateGroupMemberRequest): Promise<void> {
    await apiClient.put(`/Group/${groupId}/members/${memberId}`, member);
  },

  // Group discovery
  async getPublicGroups(): Promise<Group[]> {
    const response = await apiClient.get<{ success: boolean; data: Group[] }>('/Group/public');
    return response.data;
  },

  async getDepartmentGroups(departmentId: string): Promise<Group[]> {
    const response = await apiClient.get<{ success: boolean; data: Group[] }>(`/Group/department/${departmentId}`);
    return response.data;
  },

  async getMyGroups(): Promise<Group[]> {
    const response = await apiClient.get<{ success: boolean; data: Group[] }>('/Group/my-groups');
    return response.data;
  },

  // Group actions
  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/Group/${groupId}/join`);
  },

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/Group/${groupId}/leave`);
  },

  // Group statistics
  async getGroupStatistics(groupId: string): Promise<GroupStatistics> {
    const response = await apiClient.get<{ success: boolean; data: GroupStatistics }>(`/Group/${groupId}/statistics`);
    return response.data;
  }
};