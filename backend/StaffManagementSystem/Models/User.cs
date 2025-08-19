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

        // Account status
        public bool IsAccountLocked { get; set; } = false;
        public DateTime? LockedUntil { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;

        // Admin permissions
        public bool IsAdministrator { get; set; } = false;
        public bool CanManageUsers { get; set; } = false;
        public bool CanManageRoles { get; set; } = false;

        // Page access permissions
        public bool CanAccessEmployees { get; set; } = false;
        public bool CanManageEmployees { get; set; } = false;
        public bool CanAccessOrganization { get; set; } = false;
        public bool CanManageOrganization { get; set; } = false;
        public bool CanAccessPayroll { get; set; } = false;
        public bool CanManagePayroll { get; set; } = false;
        public bool CanAccessApprovals { get; set; } = false;
        public bool CanManageApprovals { get; set; } = false;
        public bool CanAccessPermissions { get; set; } = false;

        public DateTime? LastLoginAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public User()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}

