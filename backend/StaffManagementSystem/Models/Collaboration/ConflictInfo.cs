namespace StaffManagementSystem.Models.Collaboration
{
    /// <summary>
    /// Represents a conflict between multiple users' changes
    /// </summary>
    public class ConflictInfo
    {
        public string ConflictId { get; set; } = Guid.NewGuid().ToString();
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public List<ConflictingChange> ConflictingChanges { get; set; } = new();
        public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
        public ConflictResolutionStatus Status { get; set; } = ConflictResolutionStatus.Pending;
        public string? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? Resolution { get; set; }
    }

    public class ConflictingChange
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public object? Value { get; set; }
        public DateTime Timestamp { get; set; }
        public int Version { get; set; }
    }

    public enum ConflictResolutionStatus
    {
        Pending,
        Resolved,
        Ignored,
        AutoResolved
    }
}