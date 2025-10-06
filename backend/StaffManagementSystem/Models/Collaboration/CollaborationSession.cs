using System.Collections.Concurrent;

namespace StaffManagementSystem.Models.Collaboration
{
    /// <summary>
    /// Represents an active collaboration session for a specific entity
    /// </summary>
    public class CollaborationSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString();
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public ConcurrentDictionary<string, CollaborationUser> Participants { get; set; } = new();
        public ConcurrentDictionary<string, FieldLock> FieldLocks { get; set; } = new();
        public List<FieldChange> ChangeHistory { get; set; } = new();
        public List<ConflictInfo> Conflicts { get; set; } = new();
        public int CurrentVersion { get; set; } = 1;
        public CollaborationSessionStatus Status { get; set; } = CollaborationSessionStatus.Active;
    }

    public class FieldLock
    {
        public string FieldName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime LockedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(5); // 5-minute lock timeout
        public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    }

    public enum CollaborationSessionStatus
    {
        Active,
        Inactive,
        Archived
    }
}