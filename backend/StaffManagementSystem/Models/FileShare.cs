using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class FileShare
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey("SharedFile")]
        public string FileId { get; set; } = string.Empty;

        [Required]
        [ForeignKey("SharedBy")]
        public string SharedById { get; set; } = string.Empty;

        [ForeignKey("SharedWith")]
        public string? SharedWithId { get; set; } // Individual employee

        [ForeignKey("SharedWithGroup")]
        public string? SharedWithGroupId { get; set; } // Group

        [ForeignKey("SharedWithDepartment")]
        public string? SharedWithDepartmentId { get; set; } // Department

        [StringLength(20)]
        public string ShareType { get; set; } = "employee"; // employee, group, department, company

        [StringLength(20)]
        public string Permission { get; set; } = "view"; // view, download, edit

        [StringLength(500)]
        public string? Message { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public DateTime SharedAt { get; set; } = DateTime.UtcNow;

        public DateTime? AccessedAt { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, expired, revoked

        // Navigation properties
        public SharedFile? SharedFile { get; set; }
        public Employee? SharedBy { get; set; }
        public Employee? SharedWith { get; set; }
        public Group? SharedWithGroup { get; set; }
        public Department? SharedWithDepartment { get; set; }

        public FileShare()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}