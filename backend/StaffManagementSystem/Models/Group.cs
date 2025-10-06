using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Group
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Group name is required")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = "project"; // department, project, company, custom

        [Required]
        [ForeignKey("Creator")]
        public string CreatorId { get; set; } = string.Empty;

        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, archived, deleted

        [StringLength(20)]
        public string Visibility { get; set; } = "private"; // public, private, department

        [StringLength(500)]
        public string? Avatar { get; set; }

        public int MaxMembers { get; set; } = 100;

        public bool AllowFileSharing { get; set; } = true;

        public bool AllowMemberInvite { get; set; } = false; // Only admins can invite by default

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public User? Creator { get; set; }
        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
        public ICollection<SharedFile> SharedFiles { get; set; } = new List<SharedFile>();

        public Group()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}