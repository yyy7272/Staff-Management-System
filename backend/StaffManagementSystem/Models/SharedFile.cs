using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class SharedFile
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "File name is required")]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Original file name is required")]
        [StringLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;

        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [StringLength(64)]
        public string? FileHash { get; set; } // For duplicate detection

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(200)]
        public string? Tags { get; set; } // JSON array of tags

        [Required]
        [ForeignKey("Uploader")]
        public string UploaderId { get; set; } = string.Empty;

        [ForeignKey("Group")]
        public string? GroupId { get; set; } // null means company-wide sharing

        [StringLength(20)]
        public string ShareType { get; set; } = "group"; // group, company, department

        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, deleted, archived

        public int DownloadCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public User? Uploader { get; set; }
        public Group? Group { get; set; }
        public ICollection<FileShare> FileShares { get; set; } = new List<FileShare>();
        public ICollection<FileVersion> Versions { get; set; } = new List<FileVersion>();

        public SharedFile()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}