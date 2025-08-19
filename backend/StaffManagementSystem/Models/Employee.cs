using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Employee
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Employee name is required")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Position is required")]
        [StringLength(50)]
        public string Position { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone format")]
        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Salary must be non-negative")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Salary { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "active";

        [Required]
        [ForeignKey("Department")]
        public string DepartmentId { get; set; } = string.Empty;

        public Department? Department { get; set; } // Navigation property

        [DataType(DataType.Date)]
        public DateTime? HireDate { get; set; }

        [StringLength(500)]
        public string? ProfileImagePath { get; set; }

        [StringLength(500)]
        public string? ProfileImageUrl { get; set; }

        [StringLength(500)]
        public string? ThumbnailImagePath { get; set; }

        [StringLength(500)]
        public string? ThumbnailImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties for approvals
        public ICollection<Approval> ApplicantApprovals { get; set; } = new List<Approval>();
        public ICollection<Approval> ApproverApprovals { get; set; } = new List<Approval>();

        public Employee()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}