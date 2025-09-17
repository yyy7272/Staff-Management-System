using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Notification
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(255)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        public NotificationType Type { get; set; } = NotificationType.Info;

        [Required]
        public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

        public bool IsRead { get; set; } = false;

        public bool IsDeleted { get; set; } = false;

        // Optional metadata for linking to specific entities
        [StringLength(100)]
        public string? EntityType { get; set; }

        [StringLength(255)]
        public string? EntityId { get; set; }

        [StringLength(500)]
        public string? ActionUrl { get; set; }

        // Who triggered this notification
        [StringLength(255)]
        public string? TriggeredByUserId { get; set; }

        [StringLength(100)]
        public string? TriggeredByUserName { get; set; }

        // Additional data as JSON
        public string? MetaData { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        public DateTime? ExpiresAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        public Notification()
        {
            Id = Guid.NewGuid().ToString();
        }
    }

    public enum NotificationType
    {
        Info = 0,
        Success = 1,
        Warning = 2,
        Error = 3,
        System = 4,
        Approval = 5,
        Reminder = 6,
        Welcome = 7,
        PasswordReset = 8,
        Security = 9,
        Employee = 10,
        Department = 11,
        Collaboration = 12
    }

    public enum NotificationPriority
    {
        Low = 0,
        Normal = 1,
        High = 2,
        Urgent = 3
    }
}