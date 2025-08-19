using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace StaffManagementSystem.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string type, string title, string description, string userId, string priority = "medium", string? entityType = null, string? entityId = null, string? triggeredByUserId = null, string? triggeredByUserName = null);
        Task<List<Notification>> GetUserNotificationsAsync(string userId, int count = 10, bool unreadOnly = false);
        Task MarkAsReadAsync(string notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly StaffDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificationService(StaffDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task CreateNotificationAsync(string type, string title, string description, string userId, string priority = "medium", string? entityType = null, string? entityId = null, string? triggeredByUserId = null, string? triggeredByUserName = null)
        {
            // Get current user info if not provided
            if (string.IsNullOrEmpty(triggeredByUserId) || string.IsNullOrEmpty(triggeredByUserName))
            {
                var currentUser = _httpContextAccessor.HttpContext?.User;
                if (currentUser?.Identity?.IsAuthenticated == true)
                {
                    triggeredByUserId ??= currentUser.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                    triggeredByUserName ??= currentUser.Identity.Name;
                }
            }

            var notification = new Notification
            {
                Type = type,
                Title = title,
                Description = description,
                Priority = priority,
                EntityType = entityType,
                EntityId = entityId,
                UserId = userId,
                TriggeredByUserId = triggeredByUserId,
                TriggeredByUserName = triggeredByUserName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int count = 10, bool unreadOnly = false)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }
    }
}