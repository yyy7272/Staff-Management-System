import { useEffect, useCallback, useRef } from 'react';
import { useCollaboration as useCollaborationContext } from '../contexts/CollaborationContext';
import type { FieldChange } from '../types/collaboration';
import { ChangeType } from '../types/collaboration';

interface UseCollaborationOptions {
  entityType: string;
  entityId: string;
  autoJoin?: boolean;
  autoConnect?: boolean;
}

interface UseCollaborationReturn {
  // Connection state
  connected: boolean;
  onlineUsers: Array<{
    userId: string;
    userName: string;
    email: string;
    avatar?: string;
    status: number;
  }>;

  // Field management
  lockField: (fieldName: string) => Promise<void>;
  unlockField: (fieldName: string) => Promise<void>;
  isFieldLocked: (fieldName: string) => boolean;
  getFieldLockOwner: (fieldName: string) => string | undefined;

  // Real-time changes
  broadcastFieldChange: (fieldName: string, oldValue: any, newValue: any) => Promise<void>;
  
  // Typing indicators
  startTyping: (fieldName: string) => Promise<void>;
  stopTyping: (fieldName: string) => Promise<void>;
  getTypingUsers: (fieldName: string) => string[];
  
  // Conflicts
  hasConflicts: boolean;
  conflicts: Array<{
    conflictId: string;
    fieldName: string;
    conflictingChanges: Array<{
      userId: string;
      userName: string;
      value: any;
      timestamp: string;
    }>;
  }>;

  // Session management
  joinSession: () => Promise<void>;
  leaveSession: () => Promise<void>;
}

export const useCollaboration = ({
  entityType,
  entityId,
  autoJoin = true,
  autoConnect = true,
}: UseCollaborationOptions): UseCollaborationReturn => {
  const collaboration = useCollaborationContext();
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const sessionJoined = useRef(false);

  // Auto-connect and join session
  useEffect(() => {
    const initializeCollaboration = async () => {
      if (autoConnect && !collaboration.state.connected) {
        try {
          await collaboration.connect();
        } catch (error) {
          console.error('Failed to connect to collaboration service:', error);
        }
      }

      if (autoJoin && collaboration.state.connected && !sessionJoined.current) {
        try {
          await collaboration.joinSession(entityType, entityId);
          sessionJoined.current = true;
        } catch (error) {
          console.error('Failed to join collaboration session:', error);
        }
      }
    };

    initializeCollaboration();
  }, [collaboration, entityType, entityId, autoConnect, autoJoin]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      
      // Leave session
      if (sessionJoined.current) {
        collaboration.leaveSession(entityType, entityId).catch(console.error);
      }
    };
  }, [collaboration, entityType, entityId]);

  const lockField = useCallback(async (fieldName: string) => {
    await collaboration.lockField(entityType, entityId, fieldName);
  }, [collaboration, entityType, entityId]);

  const unlockField = useCallback(async (fieldName: string) => {
    await collaboration.unlockField(entityType, entityId, fieldName);
  }, [collaboration, entityType, entityId]);

  const isFieldLocked = useCallback((fieldName: string) => {
    return collaboration.isFieldLocked(fieldName);
  }, [collaboration]);

  const getFieldLockOwner = useCallback((fieldName: string) => {
    const lock = collaboration.getFieldLock(fieldName);
    return lock?.userName;
  }, [collaboration]);

  const broadcastFieldChange = useCallback(async (fieldName: string, oldValue: any, newValue: any) => {
    const change: Omit<FieldChange, 'userId' | 'userName' | 'timestamp' | 'changeId' | 'version'> = {
      fieldName,
      oldValue,
      newValue,
      changeType: ChangeType.Update,
    };

    await collaboration.broadcastChange(entityType, entityId, change);
  }, [collaboration, entityType, entityId]);

  const startTyping = useCallback(async (fieldName: string) => {
    // Clear existing timeout for this field
    if (typingTimeouts.current[fieldName]) {
      clearTimeout(typingTimeouts.current[fieldName]);
    }

    await collaboration.startTyping(entityType, entityId, fieldName);

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeouts.current[fieldName] = setTimeout(() => {
      collaboration.stopTyping(entityType, entityId, fieldName).catch(console.error);
      delete typingTimeouts.current[fieldName];
    }, 3000);
  }, [collaboration, entityType, entityId]);

  const stopTyping = useCallback(async (fieldName: string) => {
    // Clear timeout
    if (typingTimeouts.current[fieldName]) {
      clearTimeout(typingTimeouts.current[fieldName]);
      delete typingTimeouts.current[fieldName];
    }

    await collaboration.stopTyping(entityType, entityId, fieldName);
  }, [collaboration, entityType, entityId]);

  const getTypingUsers = useCallback((fieldName: string) => {
    return collaboration.getTypingUsers(fieldName);
  }, [collaboration]);

  const joinSession = useCallback(async () => {
    if (!sessionJoined.current) {
      await collaboration.joinSession(entityType, entityId);
      sessionJoined.current = true;
    }
  }, [collaboration, entityType, entityId]);

  const leaveSession = useCallback(async () => {
    if (sessionJoined.current) {
      await collaboration.leaveSession(entityType, entityId);
      sessionJoined.current = false;
    }
  }, [collaboration, entityType, entityId]);

  return {
    // Connection state
    connected: collaboration.state.connected,
    onlineUsers: collaboration.state.onlineUsers.map(user => ({
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    })),

    // Field management
    lockField,
    unlockField,
    isFieldLocked,
    getFieldLockOwner,

    // Real-time changes
    broadcastFieldChange,

    // Typing indicators
    startTyping,
    stopTyping,
    getTypingUsers,

    // Conflicts
    hasConflicts: collaboration.hasConflicts(),
    conflicts: collaboration.getConflicts().map(conflict => ({
      conflictId: conflict.conflictId,
      fieldName: conflict.fieldName,
      conflictingChanges: conflict.conflictingChanges.map(change => ({
        userId: change.userId,
        userName: change.userName,
        value: change.value,
        timestamp: change.timestamp,
      })),
    })),

    // Session management
    joinSession,
    leaveSession,
  };
};