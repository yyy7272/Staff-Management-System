using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class FileVersion
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey("SharedFile")]
        public string FileId { get; set; } = string.Empty;

        [Required]
        public int VersionNumber { get; set; }

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [StringLength(64)]
        public string? FileHash { get; set; }

        [StringLength(500)]
        public string? ChangeDescription { get; set; }

        [Required]
        [ForeignKey("UploadedBy")]
        public string UploadedById { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, deleted

        // Navigation properties
        public SharedFile? SharedFile { get; set; }
        public User? UploadedBy { get; set; }

        public FileVersion()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}