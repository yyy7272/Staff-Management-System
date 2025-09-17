export interface SharedFile {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  fileSizeFormatted: string;
  description?: string;
  tags: string[];
  uploaderId: string;
  uploaderName: string;
  groupId?: string;
  groupName?: string;
  shareType: 'group' | 'company' | 'department';
  status: 'active' | 'deleted' | 'archived';
  downloadCount: number;
  createdAt: string;
  updatedAt?: string;
  versions: FileVersion[];
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface FileVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  changeDescription?: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface UploadFileRequest {
  file: File;
  description?: string;
  tags: string;
  groupId?: string;
  shareType: 'group' | 'company' | 'department';
}

export interface UpdateFileRequest {
  description?: string;
  tags?: string;
  status?: 'active' | 'deleted' | 'archived';
}

export interface ShareFileRequest {
  fileId: string;
  shareType: 'employee' | 'group' | 'department' | 'company';
  employeeId?: string;
  groupId?: string;
  departmentId?: string;
  permission: 'view' | 'download' | 'edit';
  message?: string;
  expiresAt?: string;
}

export interface FileShare {
  id: string;
  fileId: string;
  fileName: string;
  sharedById: string;
  sharedByName: string;
  sharedWithId?: string;
  sharedWithName?: string;
  shareType: 'employee' | 'group' | 'department' | 'company';
  permission: 'view' | 'download' | 'edit';
  message?: string;
  expiresAt?: string;
  sharedAt: string;
  accessedAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface StorageUsage {
  usageBytes: number;
  usageFormatted: string;
}