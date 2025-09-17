// Collaboration types matching backend models

export interface CollaborationUser {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  connectionId: string;
  joinedAt: string;
  lastActivity: string;
  status: UserPresenceStatus;
  typingFields: Record<string, string>;
}

export const UserPresenceStatus = {
  Online: 0,
  Away: 1,
  Busy: 2,
  Offline: 3,
} as const;

export type UserPresenceStatus = typeof UserPresenceStatus[keyof typeof UserPresenceStatus];

export interface FieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  userId: string;
  userName: string;
  timestamp: string;
  changeId: string;
  version: number;
  changeType: ChangeType;
}

export const ChangeType = {
  Create: 0,
  Update: 1,
  Delete: 2,
  Lock: 3,
  Unlock: 4,
} as const;

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];

export interface ConflictInfo {
  conflictId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  conflictingChanges: ConflictingChange[];
  detectedAt: string;
  status: ConflictResolutionStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ConflictingChange {
  userId: string;
  userName: string;
  value: any;
  timestamp: string;
  version: number;
}

export const ConflictResolutionStatus = {
  Pending: 0,
  Resolved: 1,
  Ignored: 2,
  AutoResolved: 3,
} as const;

export type ConflictResolutionStatus = typeof ConflictResolutionStatus[keyof typeof ConflictResolutionStatus];

export interface FieldLock {
  fieldName: string;
  userId: string;
  userName: string;
  lockedAt: string;
  expiresAt: string;
}

// Client-side collaboration state
export interface CollaborationState {
  connected: boolean;
  connectionId?: string;
  currentSession?: string;
  onlineUsers: CollaborationUser[];
  fieldLocks: Record<string, FieldLock>;
  conflicts: ConflictInfo[];
  typingUsers: Record<string, string[]>; // fieldName -> userNames[]
  lastActivity: string;
}

// Events
export interface CollaborationEvents {
  onUserJoined: (entityType: string, entityId: string, user: CollaborationUser) => void;
  onUserLeft: (entityType: string, entityId: string, userId: string) => void;
  onFieldLocked: (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => void;
  onFieldUnlocked: (entityType: string, entityId: string, fieldName: string) => void;
  onDataChanged: (entityType: string, entityId: string, change: FieldChange) => void;
  onConflictDetected: (entityType: string, entityId: string, conflict: ConflictInfo) => void;
  onUserTyping: (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => void;
  onUserStoppedTyping: (entityType: string, entityId: string, fieldName: string, userId: string) => void;
  onSystemNotification: (message: string, type: string) => void;
  onOnlineUsersUpdated: (entityType: string, entityId: string, users: CollaborationUser[]) => void;
}

export interface CollaborationService {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinSession: (entityType: string, entityId: string) => Promise<void>;
  leaveSession: (entityType: string, entityId: string) => Promise<void>;
  lockField: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  unlockField: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  broadcastChange: (entityType: string, entityId: string, change: Omit<FieldChange, 'userId' | 'userName' | 'timestamp' | 'changeId' | 'version'>) => Promise<void>;
  startTyping: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  stopTyping: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  getConnectionState: () => 'Connected' | 'Disconnected' | 'Connecting' | 'Reconnecting';
  on: <K extends keyof CollaborationEvents>(event: K, handler: CollaborationEvents[K]) => void;
  off: <K extends keyof CollaborationEvents>(event: K, handler: CollaborationEvents[K]) => void;
}