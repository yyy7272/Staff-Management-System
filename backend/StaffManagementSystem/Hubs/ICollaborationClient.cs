using StaffManagementSystem.Models.Collaboration;
using StaffManagementSystem.DataTransferObj;

namespace StaffManagementSystem.Hubs
{
    /// <summary>
    /// Interface defining client methods that can be invoked by the server
    /// </summary>
    public interface ICollaborationClient
    {
        /// <summary>
        /// Notify client when a user joins a collaboration session
        /// </summary>
        Task UserJoined(string entityType, string entityId, CollaborationUser user);

        /// <summary>
        /// Notify client when a user leaves a collaboration session
        /// </summary>
        Task UserLeft(string entityType, string entityId, string userId);

        /// <summary>
        /// Notify client when a field is locked by another user
        /// </summary>
        Task FieldLocked(string entityType, string entityId, string fieldName, string userId, string userName);

        /// <summary>
        /// Notify client when a field is unlocked
        /// </summary>
        Task FieldUnlocked(string entityType, string entityId, string fieldName);

        /// <summary>
        /// Notify client of real-time data changes
        /// </summary>
        Task DataChanged(string entityType, string entityId, FieldChange change);

        /// <summary>
        /// Notify client of conflicts detected
        /// </summary>
        Task ConflictDetected(string entityType, string entityId, ConflictInfo conflict);

        /// <summary>
        /// Notify client when a user starts typing in a field
        /// </summary>
        Task UserTyping(string entityType, string entityId, string fieldName, string userId, string userName);

        /// <summary>
        /// Notify client when a user stops typing in a field
        /// </summary>
        Task UserStoppedTyping(string entityType, string entityId, string fieldName, string userId);

        /// <summary>
        /// Send system notification to client
        /// </summary>
        Task SystemNotification(string message, string type);

        /// <summary>
        /// Notify about online users in a session
        /// </summary>
        Task OnlineUsersUpdated(string entityType, string entityId, List<CollaborationUser> users);

        /// <summary>
        /// Send notification to client
        /// </summary>
        Task ReceiveNotification(NotificationDto notification);
    }
}