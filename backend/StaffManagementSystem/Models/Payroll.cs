using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class Payroll
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(255)]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [Required]
        public DateTime PayPeriodStart { get; set; }

        [Required]
        public DateTime PayPeriodEnd { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal BaseSalary { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Overtime { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Bonus { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Deductions { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxWithholding { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal NetPay { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "draft"; // draft, processed, paid

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [StringLength(255)]
        public string? ProcessedBy { get; set; }

        public DateTime? ProcessedAt { get; set; }

        // Calculate net pay automatically
        public void CalculateNetPay()
        {
            NetPay = BaseSalary + Overtime + Bonus - Deductions - TaxWithholding;
        }
    }
}