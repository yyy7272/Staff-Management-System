using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.DataTransferObj
{
    public class UserRegisterDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email must not exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]", 
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
        public string Password { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "First name must not exceed 100 characters")]
        public string? FirstName { get; set; }

        [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters")]
        public string? LastName { get; set; }

        public string Role { get; set; } = "User";
    }
}
