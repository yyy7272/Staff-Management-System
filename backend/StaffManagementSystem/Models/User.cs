using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagementSystem.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Username is required")]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [StringLength(100)]
        public string? FirstName { get; set; }

        [StringLength(100)]
        public string? LastName { get; set; }

        [Required]
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

        [Required]
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

        public bool IsActive { get; set; } = true;

        // Email verification fields
        public bool EmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }

        // Password reset fields
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Account status
        public bool IsAccountLocked { get; set; } = false;
        public DateTime? LockedUntil { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;

        // Admin permissions
        public bool IsAdministrator { get; set; } = false;
        public bool CanManageUsers { get; set; } = false;
        public bool CanManageRoles { get; set; } = false;

        // Page access permissions
        public bool CanAccessUsers { get; set; } = false;
        public bool CanAccessOrganization { get; set; } = false;
        public bool CanManageOrganization { get; set; } = false;
        public bool CanAccessPayroll { get; set; } = false;
        public bool CanManagePayroll { get; set; } = false;
        public bool CanAccessApprovals { get; set; } = false;
        public bool CanManageApprovals { get; set; } = false;
        public bool CanAccessPermissions { get; set; } = false;

        public DateTime? LastLoginAt { get; set; }

        // User-related fields
        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, inactive, on_leave

        [StringLength(50)]
        public string? Position { get; set; }

        [Phone(ErrorMessage = "Invalid phone format")]
        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Salary must be non-negative")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Salary { get; set; }

        [ForeignKey("Department")]
        public string? DepartmentId { get; set; }

        public Department? Department { get; set; } // Navigation property

        [DataType(DataType.Date)]
        public DateTime? HireDate { get; set; }

        // Avatar/Profile Image fields
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

        // Computed properties for backward compatibility
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}".Trim();

        [NotMapped]
        public string Name
        {
            get => !string.IsNullOrEmpty(FullName) ? FullName : Username;
            set
            {
                // Parse the name into FirstName and LastName
                if (!string.IsNullOrEmpty(value))
                {
                    var parts = value.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                    FirstName = parts.Length > 0 ? parts[0] : value;
                    LastName = parts.Length > 1 ? parts[1] : "";
                }
            }
        }

        public User()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}

