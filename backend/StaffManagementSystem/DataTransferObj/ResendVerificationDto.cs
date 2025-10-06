using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.DataTransferObj
{
    public class ResendVerificationDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;
    }
}