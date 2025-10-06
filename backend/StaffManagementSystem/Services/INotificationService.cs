using StaffManagementSystem.DataTransferObj;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.Services
{
    public interface INotificationService
    {
        // Legacy methods for backward compatibility
        Task CreateNotificationAsync(string type, string title, string description, string userId, string priority = "medium", string? entityType = null, string? entityId = null, string? triggeredByUserId = null, string? triggeredByUserName = null);
        Task<List<Notification>> GetUserNotificationsAsync(string userId, int count = 10, bool unreadOnly = false);
        Task MarkAsReadAsync(string notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);

        // Enhanced methods
        Task<NotificationDto?> GetNotificationByIdAsync(string id);
        Task<object> GetNotificationsAsync(NotificationQueryDto query);
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
        Task<List<NotificationDto>> CreateBulkNotificationsAsync(BulkNotificationDto dto);
        Task<NotificationDto?> UpdateNotificationAsync(string id, UpdateNotificationDto dto);
        Task<bool> DeleteNotificationAsync(string id);
        Task<object> GetUserNotificationsAsync(string userId, NotificationQueryDto query);
        Task<NotificationStatsDto> GetUserNotificationStatsAsync(string userId);
        Task<bool> DeleteUserNotificationAsync(string id, string userId);
        Task<int> DeleteOldNotificationsAsync(string userId, DateTime olderThan);
        Task<int> CleanupExpiredNotificationsAsync();
        Task<Dictionary<string, NotificationStatsDto>> GetSystemNotificationStatsAsync();

        // Real-time operations
        Task SendRealTimeNotificationAsync(string userId, NotificationDto notification);
        Task SendRealTimeNotificationToMultipleUsersAsync(List<string> userIds, NotificationDto notification);

        // Template-based notifications
        Task<NotificationDto> CreateWelcomeNotificationAsync(string userId, string userName);
        Task<NotificationDto> CreateApprovalNotificationAsync(string userId, string approvalId, string approvalTitle, string triggerUserName);
        Task<NotificationDto> CreateEmployeeCreatedNotificationAsync(string userId, string UserName, string triggerUserName);
        Task<NotificationDto> CreatePasswordResetNotificationAsync(string userId);
        Task<NotificationDto> CreateSecurityAlertNotificationAsync(string userId, string alertMessage);
        Task<NotificationDto> CreateCollaborationNotificationAsync(string userId, string entityType, string entityId, string message, string triggerUserName);
    }
}