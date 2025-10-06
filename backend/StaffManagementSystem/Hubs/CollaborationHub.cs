using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using StaffManagementSystem.Models.Collaboration;
using StaffManagementSystem.Services;
using System.Security.Claims;

namespace StaffManagementSystem.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time collaboration features
    /// </summary>
    [Authorize]
    public class CollaborationHub : Hub<ICollaborationClient>
    {
        private readonly ICollaborationService _collaborationService;
        private readonly ILogger<CollaborationHub> _logger;

        public CollaborationHub(ICollaborationService collaborationService, ILogger<CollaborationHub> logger)
        {
            _collaborationService = collaborationService;
            _logger = logger;
        }

        /// <summary>
        /// Join a collaboration session for a specific entity
        /// </summary>
        public async Task JoinSession(string entityType, string entityId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();
                var groupName = GetGroupName(entityType, entityId);

                _logger.LogInformation("User {UserId} joining collaboration session for {EntityType}:{EntityId}", 
                    userId, entityType, entityId);

                // Add to SignalR group
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                // Register user in collaboration service
                var user = await _collaborationService.JoinSessionAsync(entityType, entityId, userId, userName, Context.ConnectionId);

                // Notify others in the group about new user
                await Clients.GroupExcept(groupName, Context.ConnectionId)
                    .UserJoined(entityType, entityId, user);

                // Send current online users to the joining user
                var onlineUsers = await _collaborationService.GetOnlineUsersAsync(entityType, entityId);
                await Clients.Caller.OnlineUsersUpdated(entityType, entityId, onlineUsers);

                _logger.LogInformation("User {UserId} successfully joined session for {EntityType}:{EntityId}", 
                    userId, entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining collaboration session for {EntityType}:{EntityId}", 
                    entityType, entityId);
                await Clients.Caller.SystemNotification($"Failed to join collaboration session: {ex.Message}", "error");
            }
        }

        /// <summary>
        /// Leave a collaboration session
        /// </summary>
        public async Task LeaveSession(string entityType, string entityId)
        {
            try
            {
                var userId = GetUserId();
                var groupName = GetGroupName(entityType, entityId);

                _logger.LogInformation("User {UserId} leaving collaboration session for {EntityType}:{EntityId}", 
                    userId, entityType, entityId);

                // Remove from SignalR group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

                // Unregister user from collaboration service
                await _collaborationService.LeaveSessionAsync(entityType, entityId, userId, Context.ConnectionId);

                // Notify others about user leaving
                await Clients.Group(groupName).UserLeft(entityType, entityId, userId);

                _logger.LogInformation("User {UserId} successfully left session for {EntityType}:{EntityId}", 
                    userId, entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving collaboration session for {EntityType}:{EntityId}", 
                    entityType, entityId);
            }
        }

        /// <summary>
        /// Lock a field for editing
        /// </summary>
        public async Task LockField(string entityType, string entityId, string fieldName)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();
                var groupName = GetGroupName(entityType, entityId);

                _logger.LogInformation("User {UserId} requesting lock on field {FieldName} for {EntityType}:{EntityId}", 
                    userId, fieldName, entityType, entityId);

                var lockResult = await _collaborationService.LockFieldAsync(entityType, entityId, fieldName, userId, userName);

                if (lockResult.Success)
                {
                    // Notify all users in the group about the field lock
                    await Clients.Group(groupName).FieldLocked(entityType, entityId, fieldName, userId, userName);
                    _logger.LogInformation("Field {FieldName} locked by user {UserId} for {EntityType}:{EntityId}", 
                        fieldName, userId, entityType, entityId);
                }
                else
                {
                    // Notify caller about lock failure
                    await Clients.Caller.SystemNotification($"Cannot lock field '{fieldName}': {lockResult.Message}", "warning");
                    _logger.LogWarning("Failed to lock field {FieldName} for user {UserId}: {Message}", 
                        fieldName, userId, lockResult.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error locking field {FieldName} for {EntityType}:{EntityId}", 
                    fieldName, entityType, entityId);
                await Clients.Caller.SystemNotification($"Error locking field: {ex.Message}", "error");
            }
        }

        /// <summary>
        /// Unlock a field
        /// </summary>
        public async Task UnlockField(string entityType, string entityId, string fieldName)
        {
            try
            {
                var userId = GetUserId();
                var groupName = GetGroupName(entityType, entityId);

                _logger.LogInformation("User {UserId} releasing lock on field {FieldName} for {EntityType}:{EntityId}", 
                    userId, fieldName, entityType, entityId);

                await _collaborationService.UnlockFieldAsync(entityType, entityId, fieldName, userId);

                // Notify all users about the field unlock
                await Clients.Group(groupName).FieldUnlocked(entityType, entityId, fieldName);

                _logger.LogInformation("Field {FieldName} unlocked by user {UserId} for {EntityType}:{EntityId}", 
                    fieldName, userId, entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking field {FieldName} for {EntityType}:{EntityId}", 
                    fieldName, entityType, entityId);
                await Clients.Caller.SystemNotification($"Error unlocking field: {ex.Message}", "error");
            }
        }

        /// <summary>
        /// Broadcast a field change to other users
        /// </summary>
        public async Task BroadcastChange(string entityType, string entityId, FieldChange change)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();
                var groupName = GetGroupName(entityType, entityId);

                // Set user info on the change
                change.UserId = userId;
                change.UserName = userName;
                change.Timestamp = DateTime.UtcNow;

                _logger.LogInformation("Broadcasting change for field {FieldName} by user {UserId} for {EntityType}:{EntityId}", 
                    change.FieldName, userId, entityType, entityId);

                // Process change through collaboration service (handles conflict detection)
                var result = await _collaborationService.ProcessFieldChangeAsync(entityType, entityId, change);

                if (result.HasConflict && result.Conflict != null)
                {
                    // Notify all users about the conflict
                    await Clients.Group(groupName).ConflictDetected(entityType, entityId, result.Conflict);
                    _logger.LogWarning("Conflict detected for field {FieldName} in {EntityType}:{EntityId}", 
                        change.FieldName, entityType, entityId);
                }
                else
                {
                    // Broadcast the change to other users (excluding sender)
                    await Clients.GroupExcept(groupName, Context.ConnectionId)
                        .DataChanged(entityType, entityId, change);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting change for {EntityType}:{EntityId}", entityType, entityId);
                await Clients.Caller.SystemNotification($"Error broadcasting change: {ex.Message}", "error");
            }
        }

        /// <summary>
        /// Indicate that user started typing in a field
        /// </summary>
        public async Task StartTyping(string entityType, string entityId, string fieldName)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();
                var groupName = GetGroupName(entityType, entityId);

                await _collaborationService.SetUserTypingAsync(entityType, entityId, fieldName, userId, true);

                // Notify others that user started typing (excluding sender)
                await Clients.GroupExcept(groupName, Context.ConnectionId)
                    .UserTyping(entityType, entityId, fieldName, userId, userName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting typing status for {EntityType}:{EntityId}", entityType, entityId);
            }
        }

        /// <summary>
        /// Indicate that user stopped typing in a field
        /// </summary>
        public async Task StopTyping(string entityType, string entityId, string fieldName)
        {
            try
            {
                var userId = GetUserId();
                var groupName = GetGroupName(entityType, entityId);

                await _collaborationService.SetUserTypingAsync(entityType, entityId, fieldName, userId, false);

                // Notify others that user stopped typing (excluding sender)
                await Clients.GroupExcept(groupName, Context.ConnectionId)
                    .UserStoppedTyping(entityType, entityId, fieldName, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing typing status for {EntityType}:{EntityId}", entityType, entityId);
            }
        }

        /// <summary>
        /// Handle user disconnection
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation("User {UserId} disconnected from collaboration hub", userId);

                // Clean up user from all sessions they were part of
                await _collaborationService.HandleUserDisconnectAsync(userId, Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling user disconnection");
            }

            await base.OnDisconnectedAsync(exception);
        }

        #region Private Helper Methods

        private string GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? Context.User?.FindFirst("sub")?.Value 
                ?? throw new InvalidOperationException("User ID not found in claims");
        }

        private string GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value 
                ?? Context.User?.FindFirst("name")?.Value 
                ?? "Unknown User";
        }

        private static string GetGroupName(string entityType, string entityId)
        {
            return $"collaboration_{entityType}_{entityId}";
        }

        #endregion
    }
}