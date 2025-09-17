using StaffManagementSystem.Models;
using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.DataTransferObj
{
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public NotificationPriority Priority { get; set; }
        public bool IsRead { get; set; }
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public string? ActionUrl { get; set; }
        public string? TriggeredByUserId { get; set; }
        public string? TriggeredByUserName { get; set; }
        public string? MetaData { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class CreateNotificationDto
    {
        [Required]
        [StringLength(255)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        public NotificationType Type { get; set; } = NotificationType.Info;

        public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

        [StringLength(100)]
        public string? EntityType { get; set; }

        [StringLength(255)]
        public string? EntityId { get; set; }

        [StringLength(500)]
        public string? ActionUrl { get; set; }

        [StringLength(255)]
        public string? TriggeredByUserId { get; set; }

        [StringLength(100)]
        public string? TriggeredByUserName { get; set; }

        public string? MetaData { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }

    public class UpdateNotificationDto
    {
        public bool? IsRead { get; set; }
        public bool? IsDeleted { get; set; }
    }

    public class NotificationQueryDto
    {
        public string? UserId { get; set; }
        public bool? IsRead { get; set; }
        public bool? IsDeleted { get; set; }
        public NotificationType? Type { get; set; }
        public NotificationPriority? Priority { get; set; }
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "DESC";
    }

    public class NotificationStatsDto
    {
        public int TotalNotifications { get; set; }
        public int UnreadNotifications { get; set; }
        public int HighPriorityUnread { get; set; }
        public int UrgentPriorityUnread { get; set; }
        public Dictionary<NotificationType, int> TypeCounts { get; set; } = new();
        public Dictionary<NotificationPriority, int> PriorityCounts { get; set; } = new();
    }

    public class BulkNotificationDto
    {
        [Required]
        public List<string> UserIds { get; set; } = new();

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        public NotificationType Type { get; set; } = NotificationType.Info;

        public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

        [StringLength(100)]
        public string? EntityType { get; set; }

        [StringLength(255)]
        public string? EntityId { get; set; }

        [StringLength(500)]
        public string? ActionUrl { get; set; }

        public string? MetaData { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }
}