export interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'project' | 'department' | 'company' | 'custom';
  creatorId: string;
  creatorName: string;
  status: 'active' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'department';
  avatar?: string;
  maxMembers: number;
  currentMemberCount: number;
  allowFileSharing: boolean;
  allowMemberInvite: boolean;
  createdAt: string;
  updatedAt?: string;
  members: GroupMember[];
  isUserMember: boolean;
  userRole?: string;
}

export interface GroupMember {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePosition: string;
  employeeDepartment: string;
  employeeAvatar?: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'active' | 'inactive' | 'banned';
  joinedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  type: 'project' | 'department' | 'company' | 'custom';
  visibility: 'public' | 'private' | 'department';
  maxMembers: number;
  allowFileSharing: boolean;
  allowMemberInvite: boolean;
  initialMembers: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'department';
  maxMembers?: number;
  allowFileSharing?: boolean;
  allowMemberInvite?: boolean;
}

export interface AddGroupMemberRequest {
  employeeId: string;
  role: 'admin' | 'moderator' | 'member';
}

export interface UpdateGroupMemberRequest {
  role: 'admin' | 'moderator' | 'member';
  status: 'active' | 'inactive' | 'banned';
}

export interface GroupStatistics {
  totalMembers: number;
  totalFiles: number;
  createdAt: string;
  lastActivity: string;
}