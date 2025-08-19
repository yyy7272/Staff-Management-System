using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Activity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public string Type { get; set; } = string.Empty; // "employee", "department", "approval", "user"

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty; // "created", "updated", "deleted", "approved", "rejected"

        [Required]
        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [StringLength(200)]
        public string? EntityName { get; set; } // Name of the entity that was affected

        [StringLength(50)]
        public string? EntityId { get; set; } // ID of the entity that was affected

        [Required]
        [StringLength(100)]
        public string UserId { get; set; } = string.Empty;

        [StringLength(100)]
        public string UserName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Activity()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}