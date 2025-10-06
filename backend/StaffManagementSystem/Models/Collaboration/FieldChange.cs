namespace StaffManagementSystem.Models.Collaboration
{
    /// <summary>
    /// Represents a change to a specific field
    /// </summary>
    public class FieldChange
    {
        public string FieldName { get; set; } = string.Empty;
        public object? OldValue { get; set; }
        public object? NewValue { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string ChangeId { get; set; } = Guid.NewGuid().ToString();
        public int Version { get; set; }
        public ChangeType ChangeType { get; set; } = ChangeType.Update;
    }

    public enum ChangeType
    {
        Create,
        Update,
        Delete,
        Lock,
        Unlock
    }
}