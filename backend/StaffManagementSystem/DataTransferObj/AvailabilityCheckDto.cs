using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.DataTransferObj
{
    public class UsernameAvailabilityDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
    }

    public class EmailAvailabilityDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class AvailabilityResponse
    {
        public bool IsAvailable { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}