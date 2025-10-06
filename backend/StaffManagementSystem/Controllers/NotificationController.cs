using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StaffManagementSystem.Services;
using StaffManagementSystem.DataTransferObj;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            INotificationService notificationService,
            ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                   User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ?? 
                   throw new UnauthorizedAccessException("User ID not found in token");
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Administrator") || 
                   User.HasClaim("IsAdministrator", "true");
        }

        // Legacy endpoint - Get user notifications with backward compatibility
        [HttpGet]
        public async Task<ActionResult<object>> GetNotifications([FromQuery] int count = 10, [FromQuery] bool unreadOnly = false)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var query = new NotificationQueryDto
                {
                    UserId = currentUserId,
                    IsRead = unreadOnly ? false : null,
                    Limit = count,
                    Page = 1
                };

                var result = await _notificationService.GetUserNotificationsAsync(currentUserId, query);
                
                // Convert to legacy format for backward compatibility
                if (result is IDictionary<string, object> dictResult && dictResult.ContainsKey("data"))
                {
                    var notifications = dictResult["data"] as List<NotificationDto>;
                    var legacyResult = notifications?.Select(n => new
                    {
                        id = n.Id,
                        type = n.Type.ToString().ToLower(),
                        title = n.Title,
                        description = n.Message, // Message maps to legacy description
                        priority = n.Priority.ToString().ToLower(),
                        entityType = n.EntityType,
                        entityId = n.EntityId,
                        triggeredByUserName = n.TriggeredByUserName,
                        isRead = n.IsRead,
                        createdAt = n.CreatedAt,
                        readAt = n.ReadAt,
                        timeAgo = GetTimeAgo(n.CreatedAt)
                    });

                    return Ok(legacyResult);
                }

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications");
                return StatusCode(500, new { message = "Failed to retrieve notifications", error = ex.Message });
            }
        }

        // Enhanced endpoint - Get notifications with full query support
        [HttpGet("query")]
        public async Task<ActionResult<object>> GetNotificationsWithQuery([FromQuery] NotificationQueryDto query)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                query.UserId = currentUserId; // Ensure user can only access their own notifications
                
                var result = await _notificationService.GetUserNotificationsAsync(currentUserId, query);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications with query");
                return StatusCode(500, new { message = "Failed to retrieve notifications", error = ex.Message });
            }
        }

        // Get notification statistics
        [HttpGet("stats")]
        public async Task<ActionResult<NotificationStatsDto>> GetNotificationStats()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var stats = await _notificationService.GetUserNotificationStatsAsync(currentUserId);
                return Ok(stats);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification statistics");
                return StatusCode(500, new { message = "Failed to retrieve notification statistics", error = ex.Message });
            }
        }

        // Legacy endpoint - Mark notification as read
        [HttpPost("{id}/mark-read")]
        public async Task<ActionResult> MarkAsRead(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _notificationService.MarkAsReadAsync(id, currentUserId);

                return Ok(new { message = "Notification marked as read" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Failed to mark notification as read", error = ex.Message });
            }
        }

        // Enhanced endpoint - Mark notification as read
        [HttpPatch("{id}/read")]
        public async Task<ActionResult> MarkAsReadEnhanced(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var updateDto = new UpdateNotificationDto { IsRead = true };
                var notification = await _notificationService.UpdateNotificationAsync(id, updateDto);
                
                if (notification == null)
                {
                    return NotFound("Notification not found or you don't have permission to modify it");
                }

                return Ok(new { message = "Notification marked as read", notification });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Failed to mark notification as read", error = ex.Message });
            }
        }

        // Legacy endpoint - Mark all notifications as read
        [HttpPost("mark-all-read")]
        public async Task<ActionResult> MarkAllAsRead()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _notificationService.MarkAllAsReadAsync(currentUserId);
                return Ok(new { message = "All notifications marked as read" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { message = "Failed to mark all notifications as read", error = ex.Message });
            }
        }

        // Enhanced endpoint - Mark all notifications as read
        [HttpPatch("read-all")]
        public async Task<ActionResult> MarkAllAsReadEnhanced()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _notificationService.MarkAllAsReadAsync(currentUserId);
                return Ok(new { message = "All notifications marked as read", success = true });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { message = "Failed to mark all notifications as read", error = ex.Message });
            }
        }

        // Legacy endpoint - Get unread count
        [HttpGet("unread-count")]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var count = await _notificationService.GetUnreadCountAsync(currentUserId);
                return Ok(new { count });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, new { message = "Failed to get unread count", error = ex.Message });
            }
        }

        // Create notification (admin only)
        [HttpPost]
        [Authorize(Policy = "RequireAdministrator")]
        public async Task<ActionResult<NotificationDto>> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var notification = await _notificationService.CreateNotificationAsync(dto);
                return CreatedAtAction(nameof(GetNotificationById), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, new { message = "Failed to create notification", error = ex.Message });
            }
        }

        // Get notification by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDto>> GetNotificationById(string id)
        {
            try
            {
                var notification = await _notificationService.GetNotificationByIdAsync(id);
                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                var currentUserId = GetCurrentUserId();
                
                // Users can only access their own notifications unless they're admin
                if (!IsAdmin() && notification.Id != currentUserId)
                {
                    return Forbid("You can only access your own notifications");
                }

                return Ok(notification);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification {NotificationId}", id);
                return StatusCode(500, new { message = "Failed to retrieve notification", error = ex.Message });
            }
        }

        // Delete notification
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteNotification(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                bool success;

                if (IsAdmin())
                {
                    // Admin can delete any notification
                    success = await _notificationService.DeleteNotificationAsync(id);
                }
                else
                {
                    // Regular user can only delete their own notifications
                    success = await _notificationService.DeleteUserNotificationAsync(id, currentUserId);
                }

                if (!success)
                {
                    return NotFound("Notification not found or you don't have permission to delete it");
                }

                return Ok(new { message = "Notification deleted successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return StatusCode(500, new { message = "Failed to delete notification", error = ex.Message });
            }
        }

        // Delete old notifications for current user
        [HttpDelete("old")]
        public async Task<ActionResult> DeleteOldNotifications([FromQuery] int daysBefore = 30)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var olderThan = DateTime.UtcNow.AddDays(-Math.Abs(daysBefore));
                var deletedCount = await _notificationService.DeleteOldNotificationsAsync(currentUserId, olderThan);
                
                return Ok(new { message = $"Deleted {deletedCount} old notifications", deletedCount });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("User not authenticated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old notifications");
                return StatusCode(500, new { message = "Failed to delete old notifications", error = ex.Message });
            }
        }

        private string GetTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;

            if (timeSpan.TotalDays >= 1)
                return $"{(int)timeSpan.TotalDays} day{((int)timeSpan.TotalDays != 1 ? "s" : "")} ago";
            
            if (timeSpan.TotalHours >= 1)
                return $"{(int)timeSpan.TotalHours} hour{((int)timeSpan.TotalHours != 1 ? "s" : "")} ago";
            
            if (timeSpan.TotalMinutes >= 1)
                return $"{(int)timeSpan.TotalMinutes} minute{((int)timeSpan.TotalMinutes != 1 ? "s" : "")} ago";
            
            return "Just now";
        }
    }
}