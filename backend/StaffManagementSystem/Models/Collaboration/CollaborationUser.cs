namespace StaffManagementSystem.Models.Collaboration
{
    /// <summary>
    /// Represents a user in a collaboration session
    /// </summary>
    public class CollaborationUser
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public DateTime LastActivity { get; set; }
        public UserPresenceStatus Status { get; set; } = UserPresenceStatus.Online;
        public Dictionary<string, DateTime> TypingFields { get; set; } = new();
    }

    public enum UserPresenceStatus
    {
        Online,
        Away,
        Busy,
        Offline
    }
}