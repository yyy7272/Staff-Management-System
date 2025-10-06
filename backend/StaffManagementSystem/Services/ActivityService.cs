using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace StaffManagementSystem.Services
{
    public interface IActivityService
    {
        Task LogActivityAsync(string type, string action, string description, string? entityName = null, string? entityId = null, string? userId = null, string? userName = null);
        Task<List<Activity>> GetRecentActivitiesAsync(int count = 10);
    }

    public class ActivityService : IActivityService
    {
        private readonly StaffDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ActivityService(StaffDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActivityAsync(string type, string action, string description, string? entityName = null, string? entityId = null, string? userId = null, string? userName = null)
        {
            // Get current user info if not provided
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userName))
            {
                var currentUser = _httpContextAccessor.HttpContext?.User;
                if (currentUser?.Identity?.IsAuthenticated == true)
                {
                    userId ??= currentUser.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ?? "system";
                    userName ??= currentUser.Identity.Name ?? "System User";
                }
                else
                {
                    userId = "system";
                    userName = "System";
                }
            }

            var activity = new Activity
            {
                Type = type,
                Action = action,
                Description = description,
                EntityName = entityName,
                EntityId = entityId,
                UserId = userId,
                UserName = userName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Activity>> GetRecentActivitiesAsync(int count = 10)
        {
            return await _context.Activities
                .OrderByDescending(a => a.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
    }
}