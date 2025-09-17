using StaffManagementSystem.Models.Collaboration;

namespace StaffManagementSystem.Services
{
    /// <summary>
    /// Service interface for managing real-time collaboration features
    /// </summary>
    public interface ICollaborationService
    {
        /// <summary>
        /// Add a user to a collaboration session
        /// </summary>
        Task<CollaborationUser> JoinSessionAsync(string entityType, string entityId, string userId, string userName, string connectionId);

        /// <summary>
        /// Remove a user from a collaboration session
        /// </summary>
        Task LeaveSessionAsync(string entityType, string entityId, string userId, string connectionId);

        /// <summary>
        /// Get all online users in a collaboration session
        /// </summary>
        Task<List<CollaborationUser>> GetOnlineUsersAsync(string entityType, string entityId);

        /// <summary>
        /// Attempt to lock a field for editing
        /// </summary>
        Task<LockResult> LockFieldAsync(string entityType, string entityId, string fieldName, string userId, string userName);

        /// <summary>
        /// Unlock a field
        /// </summary>
        Task UnlockFieldAsync(string entityType, string entityId, string fieldName, string userId);

        /// <summary>
        /// Process a field change and detect conflicts
        /// </summary>
        Task<ChangeProcessResult> ProcessFieldChangeAsync(string entityType, string entityId, FieldChange change);

        /// <summary>
        /// Set user typing status for a field
        /// </summary>
        Task SetUserTypingAsync(string entityType, string entityId, string fieldName, string userId, bool isTyping);

        /// <summary>
        /// Handle user disconnection cleanup
        /// </summary>
        Task HandleUserDisconnectAsync(string userId, string connectionId);

        /// <summary>
        /// Get collaboration session for an entity
        /// </summary>
        Task<CollaborationSession?> GetSessionAsync(string entityType, string entityId);

        /// <summary>
        /// Clean up expired sessions and locks
        /// </summary>
        Task CleanupExpiredSessionsAsync();
    }

    /// <summary>
    /// Result of attempting to lock a field
    /// </summary>
    public class LockResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public FieldLock? Lock { get; set; }
    }

    /// <summary>
    /// Result of processing a field change
    /// </summary>
    public class ChangeProcessResult
    {
        public bool Success { get; set; }
        public bool HasConflict { get; set; }
        public ConflictInfo? Conflict { get; set; }
        public FieldChange? ProcessedChange { get; set; }
    }
}