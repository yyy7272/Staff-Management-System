using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication
    public class AdminController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(StaffDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("users")]
        [Authorize] // Admin access checked in method
        public async Task<ActionResult<object>> GetUsers([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.CanManageUsers)
            {
                return Forbid("Access denied. Admin privileges required.");
            }

            var totalUsers = await _context.Users.CountAsync();
            var users = await _context.Users
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.IsActive,
                    u.EmailVerified,
                    u.IsAdministrator,
                    u.CanManageUsers,
                    u.CanManageRoles,
                    u.CanAccessUsers,
                    u.CanAccessOrganization,
                    u.CanManageOrganization,
                    u.CanAccessPayroll,
                    u.CanManagePayroll,
                    u.CanAccessApprovals,
                    u.CanManageApprovals,
                    u.CanAccessPermissions,
                    u.CreatedAt,
                    u.LastLoginAt
                })
                .OrderBy(u => u.Username)
                .ToListAsync();

            return Ok(new
            {
                users = users,
                totalCount = totalUsers,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalUsers / (double)limit)
            });
        }

        [HttpPost("users/{userId}/permissions")]
        public async Task<IActionResult> UpdateUserPermissions(string userId, [FromBody] UpdatePermissionsDto dto)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.CanManageUsers)
            {
                return Forbid("Access denied. Admin privileges required.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Prevent users from modifying their own admin status (safety measure)
            if (user.Id == currentUser.Id && dto.IsAdministrator != user.IsAdministrator)
            {
                return BadRequest("You cannot modify your own administrator status.");
            }

            // Update admin permissions
            user.IsAdministrator = dto.IsAdministrator;
            user.CanManageUsers = dto.CanManageUsers;
            user.CanManageRoles = dto.CanManageRoles;
            
            // Update page access permissions
            user.CanAccessUsers = dto.CanAccessUsers;
            user.CanManageUsers = dto.CanManageUsers;
            user.CanAccessOrganization = dto.CanAccessOrganization;
            user.CanManageOrganization = dto.CanManageOrganization;
            user.CanAccessPayroll = dto.CanAccessPayroll;
            user.CanManagePayroll = dto.CanManagePayroll;
            user.CanAccessApprovals = dto.CanAccessApprovals;
            user.CanManageApprovals = dto.CanManageApprovals;
            user.CanAccessPermissions = dto.CanAccessPermissions;
            
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User permissions updated by {AdminUser} for user {TargetUser}: Admin={IsAdmin}, Pages=[Users:{CanAccessUsers}/{CanManageUsers}, Org:{CanAccessOrganization}/{CanManageOrganization}, Payroll:{CanAccessPayroll}/{CanManagePayroll}, Approvals:{CanAccessApprovals}/{CanManageApprovals}, Permissions:{CanAccessPermissions}]",
                currentUser.Username, user.Username, dto.IsAdministrator, dto.CanAccessUsers, dto.CanManageUsers, dto.CanAccessOrganization, dto.CanManageOrganization, dto.CanAccessPayroll, dto.CanManagePayroll, dto.CanAccessApprovals, dto.CanManageApprovals, dto.CanAccessPermissions);

            return Ok(new
            {
                message = "User permissions updated successfully.",
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.IsAdministrator,
                    user.CanManageUsers,
                    user.CanManageRoles,
                    user.CanAccessUsers,
                    user.CanAccessOrganization,
                    user.CanManageOrganization,
                    user.CanAccessPayroll,
                    user.CanManagePayroll,
                    user.CanAccessApprovals,
                    user.CanManageApprovals,
                    user.CanAccessPermissions
                }
            });
        }

        [HttpPost("users/{userId}/activate")]
        public async Task<IActionResult> ActivateUser(string userId)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.CanManageUsers)
            {
                return Forbid("Access denied. Admin privileges required.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsActive = true;
            user.IsAccountLocked = false;
            user.LockedUntil = null;
            user.FailedLoginAttempts = 0;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} activated by admin {AdminUser}", user.Username, currentUser.Username);

            return Ok(new { message = "User activated successfully." });
        }

        [HttpPost("users/{userId}/deactivate")]
        public async Task<IActionResult> DeactivateUser(string userId)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.CanManageUsers)
            {
                return Forbid("Access denied. Admin privileges required.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Prevent users from deactivating themselves
            if (user.Id == currentUser.Id)
            {
                return BadRequest("You cannot deactivate your own account.");
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} deactivated by admin {AdminUser}", user.Username, currentUser.Username);

            return Ok(new { message = "User deactivated successfully." });
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.IsAdministrator)
            {
                return Forbid("Access denied. Administrator privileges required.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Prevent users from deleting themselves
            if (user.Id == currentUser.Id)
            {
                return BadRequest("You cannot delete your own account.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} deleted by administrator {AdminUser}", user.Username, currentUser.Username);

            return Ok(new { message = "User deleted successfully." });
        }

        [HttpGet("system-info")]
        public async Task<ActionResult<object>> GetSystemInfo()
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.IsAdministrator)
            {
                return Forbid("Access denied. Administrator privileges required.");
            }

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var verifiedUsers = await _context.Users.CountAsync(u => u.EmailVerified);
            var adminUsers = await _context.Users.CountAsync(u => u.IsAdministrator);

            return Ok(new
            {
                totalUsers = totalUsers,
                activeUsers = activeUsers,
                verifiedUsers = verifiedUsers,
                adminUsers = adminUsers,
                systemVersion = "1.0.0",
                lastSystemUpdate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
                return null;

            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }
    }

    public class UpdatePermissionsDto
    {
        // Admin permissions
        public bool IsAdministrator { get; set; }
        public bool CanManageUsers { get; set; }
        public bool CanManageRoles { get; set; }

        // Page access permissions
        public bool CanAccessUsers { get; set; }
        public bool CanAccessOrganization { get; set; }
        public bool CanManageOrganization { get; set; }
        public bool CanAccessPayroll { get; set; }
        public bool CanManagePayroll { get; set; }
        public bool CanAccessApprovals { get; set; }
        public bool CanManageApprovals { get; set; }
        public bool CanAccessPermissions { get; set; }
    }
}