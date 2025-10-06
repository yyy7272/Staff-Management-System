using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Approval
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Title is required")]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Type is required")]
        [StringLength(50)]
        public string Type { get; set; }

        [Required(ErrorMessage = "Priority is required")]
        [StringLength(20)]
        public string Priority { get; set; } = "medium";

        [StringLength(20)]
        public string Status { get; set; } = "pending";

        [Required]
        [ForeignKey("Applicant")]
        public string ApplicantId { get; set; }

        public User? Applicant { get; set; }

        [ForeignKey("Approver")]
        public string? ApproverId { get; set; }

        public User? Approver { get; set; }

        [ForeignKey("Department")]
        public string? DepartmentId { get; set; }

        public Department? Department { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.UtcNow;

        public DateTime? ResponseDate { get; set; }

        public DateTime? DueDate { get; set; }

        [StringLength(500)]
        public string? ApprovalNotes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Amount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Approval()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}