using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.DataTransferObj;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using StaffManagementSystem.Hubs;

namespace StaffManagementSystem.Services
{

    public class NotificationService : INotificationService
    {
        private readonly StaffDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<CollaborationHub, ICollaborationClient> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            StaffDbContext context, 
            IHttpContextAccessor httpContextAccessor,
            IHubContext<CollaborationHub, ICollaborationClient> hubContext,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _hubContext = hubContext;
            _logger = logger;
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

            // Parse enum values
            NotificationType notificationType = Enum.TryParse<NotificationType>(type, true, out var parsedType) ? parsedType : NotificationType.Info;
            NotificationPriority notificationPriority = Enum.TryParse<NotificationPriority>(priority, true, out var parsedPriority) ? parsedPriority : NotificationPriority.Normal;

            var notification = new Notification
            {
                Type = notificationType,
                Title = title,
                Message = description,
                Priority = notificationPriority,
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

        // Enhanced CRUD operations
        public async Task<NotificationDto?> GetNotificationByIdAsync(string id)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);

            if (notification == null)
                return null;

            return MapToDto(notification);
        }

        public async Task<object> GetNotificationsAsync(NotificationQueryDto query)
        {
            var dbQuery = _context.Notifications.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.UserId))
                dbQuery = dbQuery.Where(n => n.UserId == query.UserId);

            if (query.IsRead.HasValue)
                dbQuery = dbQuery.Where(n => n.IsRead == query.IsRead.Value);

            if (query.IsDeleted.HasValue)
                dbQuery = dbQuery.Where(n => n.IsDeleted == query.IsDeleted.Value);
            else
                dbQuery = dbQuery.Where(n => !n.IsDeleted);

            if (query.Type.HasValue)
                dbQuery = dbQuery.Where(n => n.Type == query.Type.Value);

            if (query.Priority.HasValue)
                dbQuery = dbQuery.Where(n => n.Priority == query.Priority.Value);

            if (!string.IsNullOrEmpty(query.EntityType))
                dbQuery = dbQuery.Where(n => n.EntityType == query.EntityType);

            if (!string.IsNullOrEmpty(query.EntityId))
                dbQuery = dbQuery.Where(n => n.EntityId == query.EntityId);

            if (query.FromDate.HasValue)
                dbQuery = dbQuery.Where(n => n.CreatedAt >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                dbQuery = dbQuery.Where(n => n.CreatedAt <= query.ToDate.Value);

            // Get total count
            var totalCount = await dbQuery.CountAsync();

            // Apply sorting
            if (query.SortBy?.ToLower() == "createdat")
            {
                dbQuery = query.SortOrder?.ToUpper() == "ASC" 
                    ? dbQuery.OrderBy(n => n.CreatedAt)
                    : dbQuery.OrderByDescending(n => n.CreatedAt);
            }
            else
            {
                dbQuery = dbQuery.OrderByDescending(n => n.CreatedAt);
            }

            // Apply pagination
            var notifications = await dbQuery
                .Skip((query.Page - 1) * query.Limit)
                .Take(query.Limit)
                .Select(n => MapToDto(n))
                .ToListAsync();

            // Calculate pagination info
            var totalPages = (int)Math.Ceiling((double)totalCount / query.Limit);

            return new
            {
                data = notifications,
                pagination = new
                {
                    page = query.Page,
                    limit = query.Limit,
                    total = totalCount,
                    totalPages = totalPages,
                    hasNextPage = query.Page < totalPages,
                    hasPreviousPage = query.Page > 1
                }
            };
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            // Get current user info if not provided
            string? triggeredByUserId = dto.TriggeredByUserId;
            string? triggeredByUserName = dto.TriggeredByUserName;

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
                Id = Guid.NewGuid().ToString(),
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                Priority = dto.Priority,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                ActionUrl = dto.ActionUrl,
                TriggeredByUserId = triggeredByUserId,
                TriggeredByUserName = triggeredByUserName,
                MetaData = dto.MetaData,
                ExpiresAt = dto.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                IsDeleted = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            var notificationDto = MapToDto(notification);

            // Send real-time notification
            try
            {
                await SendRealTimeNotificationAsync(dto.UserId, notificationDto);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send real-time notification for user {UserId}", dto.UserId);
            }

            return notificationDto;
        }

        public async Task<List<NotificationDto>> CreateBulkNotificationsAsync(BulkNotificationDto dto)
        {
            var notifications = new List<Notification>();
            var currentUser = _httpContextAccessor.HttpContext?.User;
            string? triggeredByUserId = null;
            string? triggeredByUserName = null;

            if (currentUser?.Identity?.IsAuthenticated == true)
            {
                triggeredByUserId = currentUser.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                triggeredByUserName = currentUser.Identity.Name;
            }

            foreach (var userId in dto.UserIds)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    Title = dto.Title,
                    Message = dto.Message,
                    Type = dto.Type,
                    Priority = dto.Priority,
                    EntityType = dto.EntityType,
                    EntityId = dto.EntityId,
                    ActionUrl = dto.ActionUrl,
                    TriggeredByUserId = triggeredByUserId,
                    TriggeredByUserName = triggeredByUserName,
                    MetaData = dto.MetaData,
                    ExpiresAt = dto.ExpiresAt,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false,
                    IsDeleted = false
                };

                notifications.Add(notification);
            }

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            var notificationDtos = notifications.Select(MapToDto).ToList();

            // Send real-time notifications
            try
            {
                await SendRealTimeNotificationToMultipleUsersAsync(dto.UserIds, notificationDtos.First());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send bulk real-time notifications");
            }

            return notificationDtos;
        }

        public async Task<NotificationDto?> UpdateNotificationAsync(string id, UpdateNotificationDto dto)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);

            if (notification == null)
                return null;

            if (dto.IsRead.HasValue)
            {
                notification.IsRead = dto.IsRead.Value;
                if (dto.IsRead.Value && notification.ReadAt == null)
                {
                    notification.ReadAt = DateTime.UtcNow;
                }
            }

            if (dto.IsDeleted.HasValue)
            {
                notification.IsDeleted = dto.IsDeleted.Value;
            }

            await _context.SaveChangesAsync();
            return MapToDto(notification);
        }

        public async Task<bool> DeleteNotificationAsync(string id)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id);

            if (notification == null)
                return false;

            notification.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object> GetUserNotificationsAsync(string userId, NotificationQueryDto query)
        {
            query.UserId = userId;
            return await GetNotificationsAsync(query);
        }

        public async Task<NotificationStatsDto> GetUserNotificationStatsAsync(string userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsDeleted)
                .ToListAsync();

            var stats = new NotificationStatsDto
            {
                TotalNotifications = notifications.Count,
                UnreadNotifications = notifications.Count(n => !n.IsRead),
                HighPriorityUnread = notifications.Count(n => !n.IsRead && n.Priority == NotificationPriority.High),
                UrgentPriorityUnread = notifications.Count(n => !n.IsRead && n.Priority == NotificationPriority.Urgent)
            };

            // Type counts
            foreach (NotificationType type in Enum.GetValues<NotificationType>())
            {
                stats.TypeCounts[type] = notifications.Count(n => n.Type == type);
            }

            // Priority counts
            foreach (NotificationPriority priority in Enum.GetValues<NotificationPriority>())
            {
                stats.PriorityCounts[priority] = notifications.Count(n => n.Priority == priority);
            }

            return stats;
        }

        public async Task<bool> DeleteUserNotificationAsync(string id, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return false;

            notification.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteOldNotificationsAsync(string userId, DateTime olderThan)
        {
            var oldNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.CreatedAt < olderThan && !n.IsDeleted)
                .ToListAsync();

            foreach (var notification in oldNotifications)
            {
                notification.IsDeleted = true;
            }

            await _context.SaveChangesAsync();
            return oldNotifications.Count;
        }

        public async Task<int> CleanupExpiredNotificationsAsync()
        {
            var now = DateTime.UtcNow;
            var expiredNotifications = await _context.Notifications
                .Where(n => n.ExpiresAt.HasValue && n.ExpiresAt.Value < now && !n.IsDeleted)
                .ToListAsync();

            foreach (var notification in expiredNotifications)
            {
                notification.IsDeleted = true;
            }

            await _context.SaveChangesAsync();
            return expiredNotifications.Count;
        }

        public async Task<Dictionary<string, NotificationStatsDto>> GetSystemNotificationStatsAsync()
        {
            var users = await _context.Users.Select(u => u.Id).ToListAsync();
            var result = new Dictionary<string, NotificationStatsDto>();

            foreach (var userId in users)
            {
                result[userId] = await GetUserNotificationStatsAsync(userId);
            }

            return result;
        }

        // Real-time operations
        public async Task SendRealTimeNotificationAsync(string userId, NotificationDto notification)
        {
            try
            {
                await _hubContext.Clients.User(userId).ReceiveNotification(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send real-time notification to user {UserId}", userId);
                throw;
            }
        }

        public async Task SendRealTimeNotificationToMultipleUsersAsync(List<string> userIds, NotificationDto notification)
        {
            try
            {
                await _hubContext.Clients.Users(userIds).ReceiveNotification(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send real-time notification to multiple users");
                throw;
            }
        }

        // Template-based notifications
        public async Task<NotificationDto> CreateWelcomeNotificationAsync(string userId, string userName)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "Welcome to the Staff Management System!",
                Message = $"Hello {userName}, welcome to our platform. We're excited to have you on board!",
                Type = NotificationType.Welcome,
                Priority = NotificationPriority.Normal
            };

            return await CreateNotificationAsync(dto);
        }

        public async Task<NotificationDto> CreateApprovalNotificationAsync(string userId, string approvalId, string approvalTitle, string triggerUserName)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "New Approval Request",
                Message = $"You have a new approval request: {approvalTitle} from {triggerUserName}",
                Type = NotificationType.Approval,
                Priority = NotificationPriority.High,
                EntityType = "Approval",
                EntityId = approvalId,
                ActionUrl = $"/approvals/{approvalId}",
                TriggeredByUserName = triggerUserName
            };

            return await CreateNotificationAsync(dto);
        }

        public async Task<NotificationDto> CreateEmployeeCreatedNotificationAsync(string userId, string UserName, string triggerUserName)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "New User Added",
                Message = $"A new User {UserName} has been added to the system by {triggerUserName}",
                Type = NotificationType.User,
                Priority = NotificationPriority.Normal,
                EntityType = "User",
                TriggeredByUserName = triggerUserName
            };

            return await CreateNotificationAsync(dto);
        }

        public async Task<NotificationDto> CreatePasswordResetNotificationAsync(string userId)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "Password Reset Successful",
                Message = "Your password has been successfully reset. If this wasn't you, please contact support immediately.",
                Type = NotificationType.PasswordReset,
                Priority = NotificationPriority.High
            };

            return await CreateNotificationAsync(dto);
        }

        public async Task<NotificationDto> CreateSecurityAlertNotificationAsync(string userId, string alertMessage)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "Security Alert",
                Message = alertMessage,
                Type = NotificationType.Security,
                Priority = NotificationPriority.Urgent
            };

            return await CreateNotificationAsync(dto);
        }

        public async Task<NotificationDto> CreateCollaborationNotificationAsync(string userId, string entityType, string entityId, string message, string triggerUserName)
        {
            var dto = new CreateNotificationDto
            {
                UserId = userId,
                Title = "Collaboration Update",
                Message = message,
                Type = NotificationType.Collaboration,
                Priority = NotificationPriority.Normal,
                EntityType = entityType,
                EntityId = entityId,
                TriggeredByUserName = triggerUserName
            };

            return await CreateNotificationAsync(dto);
        }

        // Private helper methods
        private static NotificationDto MapToDto(Notification notification)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                Priority = notification.Priority,
                IsRead = notification.IsRead,
                EntityType = notification.EntityType,
                EntityId = notification.EntityId,
                ActionUrl = notification.ActionUrl,
                TriggeredByUserId = notification.TriggeredByUserId,
                TriggeredByUserName = notification.TriggeredByUserName,
                MetaData = notification.MetaData,
                CreatedAt = notification.CreatedAt,
                ReadAt = notification.ReadAt,
                ExpiresAt = notification.ExpiresAt
            };
        }
    }
}