using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class GroupMember
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey("Group")]
        public string GroupId { get; set; } = string.Empty;

        [Required]
        [ForeignKey("User")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "member"; // admin, moderator, member

        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, inactive, banned

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Group? Group { get; set; }
        public User? User { get; set; }

        public GroupMember()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}