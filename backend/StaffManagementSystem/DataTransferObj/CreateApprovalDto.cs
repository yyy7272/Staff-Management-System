using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.DataTransferObj
{
    public class CreateApprovalDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Type is required")]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required(ErrorMessage = "Priority is required")]
        [StringLength(20)]
        public string Priority { get; set; } = "medium";

        public decimal? Amount { get; set; }

        public DateTime? DueDate { get; set; }

        public string? StartDate { get; set; }

        public string? EndDate { get; set; }

        public string[]? Attachments { get; set; }
    }
}