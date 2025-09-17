import * as signalR from '@microsoft/signalr';
import type { 
  CollaborationService, 
  CollaborationEvents, 
  FieldChange,
  CollaborationUser,
  ConflictInfo
} from '../types/collaboration';
import { getApiUrl } from '../config/environment';

class SignalRCollaborationService implements CollaborationService {
  private connection: signalR.HubConnection | null = null;
  private eventHandlers: Partial<CollaborationEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms

  constructor() {
    this.setupConnection();
  }

  private setupConnection() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiUrl('')}/collaborationHub`, {
        accessTokenFactory: () => token || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then 16s
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 16000);
          return delay;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Connection events
    this.connection.onclose((error) => {
      console.warn('SignalR connection closed:', error);
      this.reconnectAttempts = 0;
    });

    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.info('SignalR reconnected with connection ID:', connectionId);
      this.reconnectAttempts = 0;
    });

    // Collaboration events from server
    this.connection.on('UserJoined', (entityType: string, entityId: string, user: CollaborationUser) => {
      this.eventHandlers.onUserJoined?.(entityType, entityId, user);
    });

    this.connection.on('UserLeft', (entityType: string, entityId: string, userId: string) => {
      this.eventHandlers.onUserLeft?.(entityType, entityId, userId);
    });

    this.connection.on('FieldLocked', (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => {
      this.eventHandlers.onFieldLocked?.(entityType, entityId, fieldName, userId, userName);
    });

    this.connection.on('FieldUnlocked', (entityType: string, entityId: string, fieldName: string) => {
      this.eventHandlers.onFieldUnlocked?.(entityType, entityId, fieldName);
    });

    this.connection.on('DataChanged', (entityType: string, entityId: string, change: FieldChange) => {
      this.eventHandlers.onDataChanged?.(entityType, entityId, change);
    });

    this.connection.on('ConflictDetected', (entityType: string, entityId: string, conflict: ConflictInfo) => {
      this.eventHandlers.onConflictDetected?.(entityType, entityId, conflict);
    });

    this.connection.on('UserTyping', (entityType: string, entityId: string, fieldName: string, userId: string, userName: string) => {
      this.eventHandlers.onUserTyping?.(entityType, entityId, fieldName, userId, userName);
    });

    this.connection.on('UserStoppedTyping', (entityType: string, entityId: string, fieldName: string, userId: string) => {
      this.eventHandlers.onUserStoppedTyping?.(entityType, entityId, fieldName, userId);
    });

    this.connection.on('SystemNotification', (message: string, type: string) => {
      this.eventHandlers.onSystemNotification?.(message, type);
    });

    this.connection.on('OnlineUsersUpdated', (entityType: string, entityId: string, users: CollaborationUser[]) => {
      this.eventHandlers.onOnlineUsersUpdated?.(entityType, entityId, users);
    });
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.setupConnection();
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection?.start();
      console.info('SignalR connected successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to SignalR hub:', error);
      
      // Retry connection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.info(`Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      } else {
        throw new Error('Failed to establish SignalR connection after maximum retry attempts');
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.info('SignalR disconnected');
    }
  }

  async joinSession(entityType: string, entityId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }

    try {
      await this.connection?.invoke('JoinSession', entityType, entityId);
      console.info(`Joined collaboration session: ${entityType}:${entityId}`);
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
      throw error;
    }
  }

  async leaveSession(entityType: string, entityId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection?.invoke('LeaveSession', entityType, entityId);
      console.info(`Left collaboration session: ${entityType}:${entityId}`);
    } catch (error) {
      console.error('Failed to leave collaboration session:', error);
      throw error;
    }
  }

  async lockField(entityType: string, entityId: string, fieldName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to collaboration hub');
    }

    try {
      await this.connection.invoke('LockField', entityType, entityId, fieldName);
    } catch (error) {
      console.error('Failed to lock field:', error);
      throw error;
    }
  }

  async unlockField(entityType: string, entityId: string, fieldName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('UnlockField', entityType, entityId, fieldName);
    } catch (error) {
      console.error('Failed to unlock field:', error);
      throw error;
    }
  }

  async broadcastChange(entityType: string, entityId: string, change: Omit<FieldChange, 'userId' | 'userName' | 'timestamp' | 'changeId' | 'version'>): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to collaboration hub');
    }

    try {
      const fullChange: FieldChange = {
        ...change,
        userId: '', // Will be set by server
        userName: '', // Will be set by server
        timestamp: new Date().toISOString(),
        changeId: crypto.randomUUID(),
        version: 0, // Will be set by server
      };

      await this.connection.invoke('BroadcastChange', entityType, entityId, fullChange);
    } catch (error) {
      console.error('Failed to broadcast change:', error);
      throw error;
    }
  }

  async startTyping(entityType: string, entityId: string, fieldName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('StartTyping', entityType, entityId, fieldName);
    } catch (error) {
      console.error('Failed to broadcast typing start:', error);
    }
  }

  async stopTyping(entityType: string, entityId: string, fieldName: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('StopTyping', entityType, entityId, fieldName);
    } catch (error) {
      console.error('Failed to broadcast typing stop:', error);
    }
  }

  getConnectionState(): 'Connected' | 'Disconnected' | 'Connecting' | 'Reconnecting' {
    if (!this.connection) return 'Disconnected';

    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'Connected';
      case signalR.HubConnectionState.Connecting:
        return 'Connecting';
      case signalR.HubConnectionState.Reconnecting:
        return 'Reconnecting';
      default:
        return 'Disconnected';
    }
  }

  on<K extends keyof CollaborationEvents>(event: K, handler: CollaborationEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof CollaborationEvents>(event: K, handler: CollaborationEvents[K]): void {
    if (this.eventHandlers[event] === handler) {
      delete this.eventHandlers[event];
    }
  }

  // Cleanup method
  destroy(): void {
    this.disconnect();
    this.eventHandlers = {};
  }
}

// Singleton instance
let collaborationService: SignalRCollaborationService | null = null;

export const getCollaborationService = (): SignalRCollaborationService => {
  if (!collaborationService) {
    collaborationService = new SignalRCollaborationService();
  }
  return collaborationService;
};

export const destroyCollaborationService = (): void => {
  if (collaborationService) {
    collaborationService.destroy();
    collaborationService = null;
  }
};