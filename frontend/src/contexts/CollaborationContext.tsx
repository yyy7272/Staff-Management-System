import React, { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import { 
  CollaborationState, 
  CollaborationUser, 
  FieldLock, 
  ConflictInfo, 
  FieldChange 
} from '../types/collaboration';
import { getCollaborationService } from '../services/collaborationService';

// Action types for collaboration state management
type CollaborationAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONNECTION_ID'; payload: string }
  | { type: 'SET_CURRENT_SESSION'; payload: string | undefined }
  | { type: 'SET_ONLINE_USERS'; payload: CollaborationUser[] }
  | { type: 'ADD_USER'; payload: CollaborationUser }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'SET_FIELD_LOCK'; payload: { fieldName: string; lock: FieldLock } }
  | { type: 'REMOVE_FIELD_LOCK'; payload: string }
  | { type: 'ADD_CONFLICT'; payload: ConflictInfo }
  | { type: 'REMOVE_CONFLICT'; payload: string }
  | { type: 'SET_USER_TYPING'; payload: { fieldName: string; userId: string; userName: string } }
  | { type: 'REMOVE_USER_TYPING'; payload: { fieldName: string; userId: string } }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'RESET_STATE' };

const initialState: CollaborationState = {
  connected: false,
  onlineUsers: [],
  fieldLocks: {},
  conflicts: [],
  typingUsers: {},
  lastActivity: new Date().toISOString(),
};

function collaborationReducer(state: CollaborationState, action: CollaborationAction): CollaborationState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    
    case 'SET_CONNECTION_ID':
      return { ...state, connectionId: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    
    case 'ADD_USER':
      return {
        ...state,
        onlineUsers: [...state.onlineUsers.filter(u => u.userId !== action.payload.userId), action.payload]
      };
    
    case 'REMOVE_USER':
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(u => u.userId !== action.payload)
      };
    
    case 'SET_FIELD_LOCK':
      return {
        ...state,
        fieldLocks: {
          ...state.fieldLocks,
          [action.payload.fieldName]: action.payload.lock
        }
      };
    
    case 'REMOVE_FIELD_LOCK':
      const newFieldLocks = { ...state.fieldLocks };
      delete newFieldLocks[action.payload];
      return { ...state, fieldLocks: newFieldLocks };
    
    case 'ADD_CONFLICT':
      return {
        ...state,
        conflicts: [...state.conflicts.filter(c => c.conflictId !== action.payload.conflictId), action.payload]
      };
    
    case 'REMOVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.filter(c => c.conflictId !== action.payload)
      };
    
    case 'SET_USER_TYPING':
      const currentTypingUsers = state.typingUsers[action.payload.fieldName] || [];
      const updatedTypingUsers = currentTypingUsers.filter(name => name !== action.payload.userName);
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.fieldName]: [...updatedTypingUsers, action.payload.userName]
        }
      };
    
    case 'REMOVE_USER_TYPING':
      const currentUsers = state.typingUsers[action.payload.fieldName] || [];
      const userToRemove = state.onlineUsers.find(u => u.userId === action.payload.userId);
      if (!userToRemove) return state;
      
      const filteredUsers = currentUsers.filter(name => name !== userToRemove.userName);
      const newTypingUsers = { ...state.typingUsers };
      
      if (filteredUsers.length === 0) {
        delete newTypingUsers[action.payload.fieldName];
      } else {
        newTypingUsers[action.payload.fieldName] = filteredUsers;
      }
      
      return { ...state, typingUsers: newTypingUsers };
    
    case 'UPDATE_LAST_ACTIVITY':
      return { ...state, lastActivity: new Date().toISOString() };
    
    case 'RESET_STATE':
      return { ...initialState };
    
    default:
      return state;
  }
}

interface CollaborationContextType {
  state: CollaborationState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinSession: (entityType: string, entityId: string) => Promise<void>;
  leaveSession: (entityType: string, entityId: string) => Promise<void>;
  lockField: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  unlockField: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  broadcastChange: (entityType: string, entityId: string, change: Omit<FieldChange, 'userId' | 'userName' | 'timestamp' | 'changeId' | 'version'>) => Promise<void>;
  startTyping: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  stopTyping: (entityType: string, entityId: string, fieldName: string) => Promise<void>;
  isFieldLocked: (fieldName: string) => boolean;
  getFieldLock: (fieldName: string) => FieldLock | undefined;
  getTypingUsers: (fieldName: string) => string[];
  hasConflicts: () => boolean;
  getConflicts: () => ConflictInfo[];
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const collaborationService = getCollaborationService();

  // Setup event handlers
  useEffect(() => {
    const handleUserJoined = (entityType: string, entityId: string, user: CollaborationUser) => {
      dispatch({ type: 'ADD_USER', payload: user });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    const handleUserLeft = (entityType: string, entityId: string, userId: string) => {
      dispatch({ type: 'REMOVE_USER', payload: userId });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    const handleFieldLocked = (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => {
      const lock: FieldLock = {
        fieldName,
        userId,
        userName,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      };
      dispatch({ type: 'SET_FIELD_LOCK', payload: { fieldName, lock } });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    const handleFieldUnlocked = (entityType: string, entityId: string, fieldName: string) => {
      dispatch({ type: 'REMOVE_FIELD_LOCK', payload: fieldName });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    const handleDataChanged = (entityType: string, entityId: string, change: FieldChange) => {
      // Handle real-time data changes here
      // This could update form fields, trigger re-renders, etc.
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
      console.info('Data changed:', change);
    };

    const handleConflictDetected = (entityType: string, entityId: string, conflict: ConflictInfo) => {
      dispatch({ type: 'ADD_CONFLICT', payload: conflict });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    const handleUserTyping = (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => {
      dispatch({ type: 'SET_USER_TYPING', payload: { fieldName, userId, userName } });
    };

    const handleUserStoppedTyping = (entityType: string, entityId: string, fieldName: string, userId: string) => {
      dispatch({ type: 'REMOVE_USER_TYPING', payload: { fieldName, userId } });
    };

    const handleSystemNotification = (message: string, type: string) => {
      // Handle system notifications (could use toast, etc.)
      console.info(`System notification (${type}):`, message);
    };

    const handleOnlineUsersUpdated = (entityType: string, entityId: string, users: CollaborationUser[]) => {
      dispatch({ type: 'SET_ONLINE_USERS', payload: users });
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    };

    // Register event handlers
    collaborationService.on('onUserJoined', handleUserJoined);
    collaborationService.on('onUserLeft', handleUserLeft);
    collaborationService.on('onFieldLocked', handleFieldLocked);
    collaborationService.on('onFieldUnlocked', handleFieldUnlocked);
    collaborationService.on('onDataChanged', handleDataChanged);
    collaborationService.on('onConflictDetected', handleConflictDetected);
    collaborationService.on('onUserTyping', handleUserTyping);
    collaborationService.on('onUserStoppedTyping', handleUserStoppedTyping);
    collaborationService.on('onSystemNotification', handleSystemNotification);
    collaborationService.on('onOnlineUsersUpdated', handleOnlineUsersUpdated);

    return () => {
      // Cleanup event handlers
      collaborationService.off('onUserJoined', handleUserJoined);
      collaborationService.off('onUserLeft', handleUserLeft);
      collaborationService.off('onFieldLocked', handleFieldLocked);
      collaborationService.off('onFieldUnlocked', handleFieldUnlocked);
      collaborationService.off('onDataChanged', handleDataChanged);
      collaborationService.off('onConflictDetected', handleConflictDetected);
      collaborationService.off('onUserTyping', handleUserTyping);
      collaborationService.off('onUserStoppedTyping', handleUserStoppedTyping);
      collaborationService.off('onSystemNotification', handleSystemNotification);
      collaborationService.off('onOnlineUsersUpdated', handleOnlineUsersUpdated);
    };
  }, [collaborationService]);

  // Update connection state based on service state
  useEffect(() => {
    const updateConnectionState = () => {
      const connectionState = collaborationService.getConnectionState();
      dispatch({ type: 'SET_CONNECTED', payload: connectionState === 'Connected' });
    };

    // Check connection state periodically
    const interval = setInterval(updateConnectionState, 1000);
    updateConnectionState();

    return () => clearInterval(interval);
  }, [collaborationService]);

  const connect = useCallback(async () => {
    await collaborationService.connect();
  }, [collaborationService]);

  const disconnect = useCallback(async () => {
    await collaborationService.disconnect();
    dispatch({ type: 'RESET_STATE' });
  }, [collaborationService]);

  const joinSession = useCallback(async (entityType: string, entityId: string) => {
    await collaborationService.joinSession(entityType, entityId);
    dispatch({ type: 'SET_CURRENT_SESSION', payload: `${entityType}:${entityId}` });
  }, [collaborationService]);

  const leaveSession = useCallback(async (entityType: string, entityId: string) => {
    await collaborationService.leaveSession(entityType, entityId);
    dispatch({ type: 'SET_CURRENT_SESSION', payload: undefined });
    dispatch({ type: 'RESET_STATE' });
  }, [collaborationService]);

  const lockField = useCallback(async (entityType: string, entityId: string, fieldName: string) => {
    await collaborationService.lockField(entityType, entityId, fieldName);
  }, [collaborationService]);

  const unlockField = useCallback(async (entityType: string, entityId: string, fieldName: string) => {
    await collaborationService.unlockField(entityType, entityId, fieldName);
  }, [collaborationService]);

  const broadcastChange = useCallback(async (entityType: string, entityId: string, change: Omit<FieldChange, 'userId' | 'userName' | 'timestamp' | 'changeId' | 'version'>) => {
    await collaborationService.broadcastChange(entityType, entityId, change);
  }, [collaborationService]);

  const startTyping = useCallback(async (entityType: string, entityId: string, fieldName: string) => {
    await collaborationService.startTyping(entityType, entityId, fieldName);
  }, [collaborationService]);

  const stopTyping = useCallback(async (entityType: string, entityId: string, fieldName: string) => {
    await collaborationService.stopTyping(entityType, entityId, fieldName);
  }, [collaborationService]);

  // Helper methods
  const isFieldLocked = useCallback((fieldName: string) => {
    const lock = state.fieldLocks[fieldName];
    if (!lock) return false;
    
    // Check if lock is expired
    const now = new Date();
    const expiresAt = new Date(lock.expiresAt);
    return now < expiresAt;
  }, [state.fieldLocks]);

  const getFieldLock = useCallback((fieldName: string) => {
    return state.fieldLocks[fieldName];
  }, [state.fieldLocks]);

  const getTypingUsers = useCallback((fieldName: string) => {
    return state.typingUsers[fieldName] || [];
  }, [state.typingUsers]);

  const hasConflicts = useCallback(() => {
    return state.conflicts.length > 0;
  }, [state.conflicts]);

  const getConflicts = useCallback(() => {
    return state.conflicts;
  }, [state.conflicts]);

  const value: CollaborationContextType = {
    state,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    lockField,
    unlockField,
    broadcastChange,
    startTyping,
    stopTyping,
    isFieldLocked,
    getFieldLock,
    getTypingUsers,
    hasConflicts,
    getConflicts,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};