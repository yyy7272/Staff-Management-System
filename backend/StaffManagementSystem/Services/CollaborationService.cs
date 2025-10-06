using Microsoft.Extensions.Caching.Memory;
using StaffManagementSystem.Models.Collaboration;
using System.Collections.Concurrent;

namespace StaffManagementSystem.Services
{
    /// <summary>
    /// Service implementation for managing real-time collaboration features
    /// </summary>
    public class CollaborationService : ICollaborationService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<CollaborationService> _logger;
        
        // In-memory storage for active sessions (in production, use Redis or similar)
        private readonly ConcurrentDictionary<string, CollaborationSession> _sessions = new();
        private readonly ConcurrentDictionary<string, HashSet<string>> _userSessions = new(); // userId -> sessionIds
        
        private const int SESSION_TIMEOUT_MINUTES = 30;
        private const int FIELD_LOCK_TIMEOUT_MINUTES = 5;
        private const int TYPING_TIMEOUT_SECONDS = 10;

        public CollaborationService(IMemoryCache cache, ILogger<CollaborationService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public Task<CollaborationUser> JoinSessionAsync(string entityType, string entityId, string userId, string userName, string connectionId)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            var session = _sessions.GetOrAdd(sessionKey, _ => new CollaborationSession
            {
                EntityType = entityType,
                EntityId = entityId,
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            });

            var user = new CollaborationUser
            {
                UserId = userId,
                UserName = userName,
                ConnectionId = connectionId,
                JoinedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow,
                Status = UserPresenceStatus.Online
            };

            // Add or update user in session
            session.Participants[userId] = user;
            session.LastActivity = DateTime.UtcNow;

            // Track user sessions for cleanup
            _userSessions.AddOrUpdate(userId, 
                new HashSet<string> { sessionKey },
                (key, existing) => 
                {
                    existing.Add(sessionKey);
                    return existing;
                });

            _logger.LogInformation("User {UserId} joined collaboration session {SessionKey}", userId, sessionKey);
            
            return Task.FromResult(user);
        }

        public Task LeaveSessionAsync(string entityType, string entityId, string userId, string connectionId)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            if (_sessions.TryGetValue(sessionKey, out var session))
            {
                // Remove user from session
                session.Participants.TryRemove(userId, out _);
                
                // Release any field locks held by this user
                var userLocks = session.FieldLocks.Where(kvp => kvp.Value.UserId == userId).ToList();
                foreach (var lockPair in userLocks)
                {
                    session.FieldLocks.TryRemove(lockPair.Key, out _);
                    _logger.LogInformation("Released field lock for {FieldName} held by user {UserId}", lockPair.Key, userId);
                }

                session.LastActivity = DateTime.UtcNow;

                // Clean up user session tracking
                if (_userSessions.TryGetValue(userId, out var userSessionSet))
                {
                    userSessionSet.Remove(sessionKey);
                    if (!userSessionSet.Any())
                    {
                        _userSessions.TryRemove(userId, out _);
                    }
                }

                // Remove session if no participants left
                if (!session.Participants.Any())
                {
                    _sessions.TryRemove(sessionKey, out _);
                    _logger.LogInformation("Removed empty collaboration session {SessionKey}", sessionKey);
                }

                _logger.LogInformation("User {UserId} left collaboration session {SessionKey}", userId, sessionKey);
            }

            return Task.CompletedTask;
        }

        public Task<List<CollaborationUser>> GetOnlineUsersAsync(string entityType, string entityId)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            if (_sessions.TryGetValue(sessionKey, out var session))
            {
                // Filter for online users and update last activity
                var onlineUsers = session.Participants.Values
                    .Where(u => u.Status == UserPresenceStatus.Online)
                    .Where(u => DateTime.UtcNow - u.LastActivity < TimeSpan.FromMinutes(SESSION_TIMEOUT_MINUTES))
                    .ToList();

                return Task.FromResult(onlineUsers);
            }

            return Task.FromResult(new List<CollaborationUser>());
        }

        public Task<LockResult> LockFieldAsync(string entityType, string entityId, string fieldName, string userId, string userName)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            // Get or create session if it doesn't exist (defensive programming for race conditions)
            var session = _sessions.GetOrAdd(sessionKey, _ => new CollaborationSession
            {
                EntityType = entityType,
                EntityId = entityId,
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            });

            // Check if field is already locked by another user
            if (session.FieldLocks.TryGetValue(fieldName, out var existingLock))
            {
                if (existingLock.UserId != userId)
                {
                    if (!existingLock.IsExpired)
                    {
                        return Task.FromResult(new LockResult
                        {
                            Success = false,
                            Message = $"Field is locked by {existingLock.UserName}",
                            Lock = existingLock
                        });
                    }
                    else
                    {
                        // Remove expired lock
                        session.FieldLocks.TryRemove(fieldName, out _);
                        _logger.LogInformation("Removed expired field lock for {FieldName}", fieldName);
                    }
                }
                else
                {
                    // User already has the lock, extend it
                    existingLock.ExpiresAt = DateTime.UtcNow.AddMinutes(FIELD_LOCK_TIMEOUT_MINUTES);
                    return Task.FromResult(new LockResult
                    {
                        Success = true,
                        Message = "Lock extended",
                        Lock = existingLock
                    });
                }
            }

            // Create new lock
            var newLock = new FieldLock
            {
                FieldName = fieldName,
                UserId = userId,
                UserName = userName,
                LockedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(FIELD_LOCK_TIMEOUT_MINUTES)
            };

            session.FieldLocks[fieldName] = newLock;
            session.LastActivity = DateTime.UtcNow;

            _logger.LogInformation("Field {FieldName} locked by user {UserId} in session {SessionKey}", 
                fieldName, userId, sessionKey);

            return Task.FromResult(new LockResult
            {
                Success = true,
                Message = "Field locked successfully",
                Lock = newLock
            });
        }

        public Task UnlockFieldAsync(string entityType, string entityId, string fieldName, string userId)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            if (_sessions.TryGetValue(sessionKey, out var session))
            {
                if (session.FieldLocks.TryGetValue(fieldName, out var fieldLock))
                {
                    // Only the lock owner can unlock (or if lock is expired)
                    if (fieldLock.UserId == userId || fieldLock.IsExpired)
                    {
                        session.FieldLocks.TryRemove(fieldName, out _);
                        session.LastActivity = DateTime.UtcNow;
                        
                        _logger.LogInformation("Field {FieldName} unlocked by user {UserId} in session {SessionKey}", 
                            fieldName, userId, sessionKey);
                    }
                }
            }
            
            return Task.CompletedTask;
        }

        public Task<ChangeProcessResult> ProcessFieldChangeAsync(string entityType, string entityId, FieldChange change)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            if (!_sessions.TryGetValue(sessionKey, out var session))
            {
                return Task.FromResult(new ChangeProcessResult
                {
                    Success = false,
                    HasConflict = false
                });
            }

            // Assign version number
            change.Version = session.CurrentVersion++;
            change.Timestamp = DateTime.UtcNow;

            // Add to change history
            session.ChangeHistory.Add(change);
            session.LastActivity = DateTime.UtcNow;

            // Simple conflict detection: check if there are recent changes to the same field by different users
            var recentChanges = session.ChangeHistory
                .Where(c => c.FieldName == change.FieldName && 
                           c.UserId != change.UserId &&
                           DateTime.UtcNow - c.Timestamp < TimeSpan.FromSeconds(30))
                .OrderByDescending(c => c.Timestamp)
                .Take(5)
                .ToList();

            if (recentChanges.Any())
            {
                // Create conflict info
                var conflict = new ConflictInfo
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    FieldName = change.FieldName,
                    DetectedAt = DateTime.UtcNow
                };

                // Add conflicting changes
                conflict.ConflictingChanges.Add(new ConflictingChange
                {
                    UserId = change.UserId,
                    UserName = change.UserName,
                    Value = change.NewValue,
                    Timestamp = change.Timestamp,
                    Version = change.Version
                });

                foreach (var recentChange in recentChanges)
                {
                    conflict.ConflictingChanges.Add(new ConflictingChange
                    {
                        UserId = recentChange.UserId,
                        UserName = recentChange.UserName,
                        Value = recentChange.NewValue,
                        Timestamp = recentChange.Timestamp,
                        Version = recentChange.Version
                    });
                }

                session.Conflicts.Add(conflict);

                _logger.LogWarning("Conflict detected for field {FieldName} in session {SessionKey}", 
                    change.FieldName, sessionKey);

                return Task.FromResult(new ChangeProcessResult
                {
                    Success = true,
                    HasConflict = true,
                    Conflict = conflict,
                    ProcessedChange = change
                });
            }

            _logger.LogInformation("Field change processed for {FieldName} by user {UserId} in session {SessionKey}", 
                change.FieldName, change.UserId, sessionKey);

            return Task.FromResult(new ChangeProcessResult
            {
                Success = true,
                HasConflict = false,
                ProcessedChange = change
            });
        }

        public Task SetUserTypingAsync(string entityType, string entityId, string fieldName, string userId, bool isTyping)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            
            if (_sessions.TryGetValue(sessionKey, out var session) && 
                session.Participants.TryGetValue(userId, out var user))
            {
                if (isTyping)
                {
                    user.TypingFields[fieldName] = DateTime.UtcNow;
                }
                else
                {
                    user.TypingFields.Remove(fieldName);
                }

                user.LastActivity = DateTime.UtcNow;
                session.LastActivity = DateTime.UtcNow;
            }
            
            return Task.CompletedTask;
        }

        public Task HandleUserDisconnectAsync(string userId, string connectionId)
        {
            _logger.LogInformation("Handling disconnect for user {UserId} with connection {ConnectionId}", userId, connectionId);

            // Find all sessions this user was part of
            if (_userSessions.TryGetValue(userId, out var userSessionSet))
            {
                foreach (var sessionKey in userSessionSet.ToList())
                {
                    if (_sessions.TryGetValue(sessionKey, out var session))
                    {
                        // Check if this connection matches
                        if (session.Participants.TryGetValue(userId, out var user) && 
                            user.ConnectionId == connectionId)
                        {
                            // Extract entity info from session key
                            var parts = sessionKey.Split('_');
                            if (parts.Length >= 3)
                            {
                                var entityType = parts[1];
                                var entityId = string.Join("_", parts.Skip(2));
                                LeaveSessionAsync(entityType, entityId, userId, connectionId);
                            }
                        }
                    }
                }
            }
            
            return Task.CompletedTask;
        }

        public Task<CollaborationSession?> GetSessionAsync(string entityType, string entityId)
        {
            var sessionKey = GetSessionKey(entityType, entityId);
            _sessions.TryGetValue(sessionKey, out var session);
            return Task.FromResult(session);
        }

        public Task CleanupExpiredSessionsAsync()
        {
            var expiredSessions = new List<string>();
            var now = DateTime.UtcNow;

            foreach (var kvp in _sessions)
            {
                var session = kvp.Value;
                
                // Remove expired users
                var expiredUsers = session.Participants.Values
                    .Where(u => now - u.LastActivity > TimeSpan.FromMinutes(SESSION_TIMEOUT_MINUTES))
                    .Select(u => u.UserId)
                    .ToList();

                foreach (var userId in expiredUsers)
                {
                    session.Participants.TryRemove(userId, out _);
                    _logger.LogInformation("Removed expired user {UserId} from session {SessionKey}", userId, kvp.Key);
                }

                // Remove expired field locks
                var expiredLocks = session.FieldLocks
                    .Where(l => l.Value.IsExpired)
                    .Select(l => l.Key)
                    .ToList();

                foreach (var fieldName in expiredLocks)
                {
                    session.FieldLocks.TryRemove(fieldName, out _);
                    _logger.LogInformation("Removed expired lock for field {FieldName} in session {SessionKey}", fieldName, kvp.Key);
                }

                // Mark session for removal if inactive and no participants
                if (!session.Participants.Any() && 
                    now - session.LastActivity > TimeSpan.FromMinutes(SESSION_TIMEOUT_MINUTES))
                {
                    expiredSessions.Add(kvp.Key);
                }
            }

            // Remove expired sessions
            foreach (var sessionKey in expiredSessions)
            {
                _sessions.TryRemove(sessionKey, out _);
                _logger.LogInformation("Removed expired session {SessionKey}", sessionKey);
            }

            // Clean up user session tracking
            var expiredUserSessions = _userSessions
                .Where(kvp => !kvp.Value.Any(s => _sessions.ContainsKey(s)))
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var userId in expiredUserSessions)
            {
                _userSessions.TryRemove(userId, out _);
            }

            if (expiredSessions.Any() || expiredUserSessions.Any())
            {
                _logger.LogInformation("Cleanup completed: removed {SessionCount} sessions, {UserCount} user tracking entries", 
                    expiredSessions.Count, expiredUserSessions.Count);
            }
            
            return Task.CompletedTask;
        }

        private static string GetSessionKey(string entityType, string entityId)
        {
            return $"session_{entityType}_{entityId}";
        }
    }
}