using StaffManagementSystem.DataTransferObj;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.Services
{
    public interface IGroupService
    {
        // Group CRUD operations
        Task<GroupDto?> GetGroupByIdAsync(string id, string currentUserId);
        Task<List<GroupDto>> GetGroupsAsync(string currentUserId, string? type = null, string? visibility = null);
        Task<GroupDto> CreateGroupAsync(CreateGroupDto dto, string currentUserId);
        Task<GroupDto?> UpdateGroupAsync(string id, UpdateGroupDto dto, string currentUserId);
        Task<bool> DeleteGroupAsync(string id, string currentUserId);

        // Group member management
        Task<bool> AddMemberAsync(string groupId, AddGroupMemberDto dto, string currentUserId);
        Task<bool> RemoveMemberAsync(string groupId, string memberId, string currentUserId);
        Task<bool> UpdateMemberRoleAsync(string groupId, string memberId, UpdateGroupMemberDto dto, string currentUserId);
        Task<List<GroupMemberDto>> GetGroupMembersAsync(string groupId, string currentUserId);

        // Group discovery and joining
        Task<List<GroupDto>> GetPublicGroupsAsync(string currentUserId);
        Task<List<GroupDto>> GetDepartmentGroupsAsync(string departmentId, string currentUserId);
        Task<bool> RequestJoinGroupAsync(string groupId, string currentUserId);
        Task<bool> LeaveGroupAsync(string groupId, string currentUserId);

        // Group statistics
        Task<object> GetGroupStatisticsAsync(string groupId, string currentUserId);
        Task<List<GroupDto>> GetUserGroupsAsync(string currentUserId);

        // Validation and permissions
        Task<bool> CanUserAccessGroupAsync(string groupId, string currentUserId);
        Task<bool> CanUserManageGroupAsync(string groupId, string currentUserId);
    }
}