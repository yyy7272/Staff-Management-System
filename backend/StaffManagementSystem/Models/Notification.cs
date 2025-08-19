using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Notification
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // "approval", "info", "success", "warning", "error"

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Priority { get; set; } = "medium"; // "low", "medium", "high", "urgent"

        [StringLength(50)]
        public string? EntityType { get; set; } // "approval", "employee", "department"

        [StringLength(50)]
        public string? EntityId { get; set; } // ID of related entity

        [Required]
        [StringLength(100)]
        public string UserId { get; set; } = string.Empty; // Who should receive this notification

        [StringLength(100)]
        public string? TriggeredByUserId { get; set; } // Who triggered this notification

        [StringLength(100)]
        public string? TriggeredByUserName { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        public Notification()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}