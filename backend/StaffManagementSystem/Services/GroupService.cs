using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.DataTransferObj;
using Microsoft.EntityFrameworkCore;

namespace StaffManagementSystem.Services
{
    public class GroupService : IGroupService
    {
        private readonly StaffDbContext _context;
        private readonly ILogger<GroupService> _logger;

        public GroupService(StaffDbContext context, ILogger<GroupService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GroupDto?> GetGroupByIdAsync(string id, string currentUserId)
        {
            var group = await _context.Groups
                .Include(g => g.Creator)
                .Include(g => g.Members)
                    .ThenInclude(m => m.Employee)
                .FirstOrDefaultAsync(g => g.Id == id && g.Status == "active");

            if (group == null) return null;

            // Check if user can access this group
            if (!await CanUserAccessGroupAsync(id, currentUserId))
                return null;

            return await MapToGroupDtoAsync(group, currentUserId);
        }

        public async Task<List<GroupDto>> GetGroupsAsync(string currentUserId, string? type = null, string? visibility = null)
        {
            var query = _context.Groups
                .Include(g => g.Creator)
                .Include(g => g.Members)
                    .ThenInclude(m => m.Employee)
                .Where(g => g.Status == "active");

            // Filter by type
            if (!string.IsNullOrEmpty(type))
                query = query.Where(g => g.Type == type);

            // Filter by visibility or user membership
            query = query.Where(g =>
                g.Visibility == "public" ||
                g.CreatorId == currentUserId ||
                g.Members.Any(m => m.EmployeeId == currentUserId && m.Status == "active"));

            if (!string.IsNullOrEmpty(visibility))
                query = query.Where(g => g.Visibility == visibility);

            var groups = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();

            var result = new List<GroupDto>();
            foreach (var group in groups)
            {
                result.Add(await MapToGroupDtoAsync(group, currentUserId));
            }

            return result;
        }

        public async Task<GroupDto> CreateGroupAsync(CreateGroupDto dto, string currentUserId)
        {
            var group = new Group
            {
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                CreatorId = currentUserId,
                Visibility = dto.Visibility,
                MaxMembers = dto.MaxMembers,
                AllowFileSharing = dto.AllowFileSharing,
                AllowMemberInvite = dto.AllowMemberInvite,
                CreatedAt = DateTime.UtcNow
            };

            _context.Groups.Add(group);

            // Add creator as admin member
            var creatorMember = new GroupMember
            {
                GroupId = group.Id,
                EmployeeId = currentUserId,
                Role = "admin",
                Status = "active",
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(creatorMember);

            // Add initial members
            foreach (var memberId in dto.InitialMembers)
            {
                if (memberId != currentUserId) // Creator is already added
                {
                    var member = new GroupMember
                    {
                        GroupId = group.Id,
                        EmployeeId = memberId,
                        Role = "member",
                        Status = "active",
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.GroupMembers.Add(member);
                }
            }

            await _context.SaveChangesAsync();

            return await GetGroupByIdAsync(group.Id, currentUserId) ?? throw new InvalidOperationException("Failed to retrieve created group");
        }

        public async Task<GroupDto?> UpdateGroupAsync(string id, UpdateGroupDto dto, string currentUserId)
        {
            var group = await _context.Groups
                .FirstOrDefaultAsync(g => g.Id == id && g.Status == "active");

            if (group == null || !await CanUserManageGroupAsync(id, currentUserId))
                return null;

            // Update properties
            if (!string.IsNullOrEmpty(dto.Name))
                group.Name = dto.Name;

            if (dto.Description != null)
                group.Description = dto.Description;

            if (!string.IsNullOrEmpty(dto.Visibility))
                group.Visibility = dto.Visibility;

            if (dto.MaxMembers.HasValue)
                group.MaxMembers = dto.MaxMembers.Value;

            if (dto.AllowFileSharing.HasValue)
                group.AllowFileSharing = dto.AllowFileSharing.Value;

            if (dto.AllowMemberInvite.HasValue)
                group.AllowMemberInvite = dto.AllowMemberInvite.Value;

            group.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetGroupByIdAsync(id, currentUserId);
        }

        public async Task<bool> DeleteGroupAsync(string id, string currentUserId)
        {
            var group = await _context.Groups
                .FirstOrDefaultAsync(g => g.Id == id && g.Status == "active");

            if (group == null || !await CanUserManageGroupAsync(id, currentUserId))
                return false;

            group.Status = "deleted";
            group.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddMemberAsync(string groupId, AddGroupMemberDto dto, string currentUserId)
        {
            if (!await CanUserManageGroupAsync(groupId, currentUserId))
                return false;

            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId && g.Status == "active");

            if (group == null) return false;

            // Check if member already exists
            if (group.Members.Any(m => m.EmployeeId == dto.EmployeeId))
                return false;

            // Check max members limit
            if (group.Members.Count(m => m.Status == "active") >= group.MaxMembers)
                return false;

            var member = new GroupMember
            {
                GroupId = groupId,
                EmployeeId = dto.EmployeeId,
                Role = dto.Role,
                Status = "active",
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(member);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RemoveMemberAsync(string groupId, string memberId, string currentUserId)
        {
            if (!await CanUserManageGroupAsync(groupId, currentUserId))
                return false;

            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.EmployeeId == memberId);

            if (member == null) return false;

            // Cannot remove the creator/admin unless transferring ownership
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group?.CreatorId == memberId)
                return false;

            _context.GroupMembers.Remove(member);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateMemberRoleAsync(string groupId, string memberId, UpdateGroupMemberDto dto, string currentUserId)
        {
            if (!await CanUserManageGroupAsync(groupId, currentUserId))
                return false;

            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.EmployeeId == memberId);

            if (member == null) return false;

            member.Role = dto.Role;
            member.Status = dto.Status;
            member.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<GroupMemberDto>> GetGroupMembersAsync(string groupId, string currentUserId)
        {
            if (!await CanUserAccessGroupAsync(groupId, currentUserId))
                return new List<GroupMemberDto>();

            var members = await _context.GroupMembers
                .Include(m => m.Employee)
                .Where(m => m.GroupId == groupId && m.Status == "active")
                .OrderBy(m => m.Role == "admin" ? 0 : m.Role == "moderator" ? 1 : 2)
                .ThenBy(m => m.JoinedAt)
                .ToListAsync();

            return members.Select(m => new GroupMemberDto
            {
                Id = m.Id,
                EmployeeId = m.EmployeeId,
                EmployeeName = m.Employee?.Name ?? "Unknown",
                EmployeeEmail = m.Employee?.Email ?? "",
                EmployeePosition = m.Employee?.Position ?? "",
                EmployeeAvatar = m.Employee?.ProfileImageUrl,
                Role = m.Role,
                Status = m.Status,
                JoinedAt = m.JoinedAt
            }).ToList();
        }

        public async Task<List<GroupDto>> GetPublicGroupsAsync(string currentUserId)
        {
            return await GetGroupsAsync(currentUserId, visibility: "public");
        }

        public async Task<List<GroupDto>> GetDepartmentGroupsAsync(string departmentId, string currentUserId)
        {
            // Get user's department
            var user = await _context.Employees.FirstOrDefaultAsync(e => e.Id == currentUserId);
            if (user?.DepartmentId != departmentId) return new List<GroupDto>();

            var groups = await _context.Groups
                .Include(g => g.Creator)
                .Include(g => g.Members)
                    .ThenInclude(m => m.Employee)
                .Where(g => g.Status == "active" && g.Type == "department")
                .ToListAsync();

            // Filter groups that belong to the same department
            var departmentGroups = groups.Where(g =>
                g.Members.Any(m =>
                    m.Employee != null &&
                    m.Employee.DepartmentId == departmentId &&
                    m.Status == "active")).ToList();

            var result = new List<GroupDto>();
            foreach (var group in departmentGroups)
            {
                result.Add(await MapToGroupDtoAsync(group, currentUserId));
            }

            return result;
        }

        public async Task<bool> RequestJoinGroupAsync(string groupId, string currentUserId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId && g.Status == "active");

            if (group == null || group.Visibility != "public") return false;

            // Check if already a member
            if (group.Members.Any(m => m.EmployeeId == currentUserId))
                return false;

            // Check max members limit
            if (group.Members.Count(m => m.Status == "active") >= group.MaxMembers)
                return false;

            var member = new GroupMember
            {
                GroupId = groupId,
                EmployeeId = currentUserId,
                Role = "member",
                Status = "active",
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(member);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> LeaveGroupAsync(string groupId, string currentUserId)
        {
            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.EmployeeId == currentUserId);

            if (member == null) return false;

            // Check if user is the creator - cannot leave unless transferring ownership
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group?.CreatorId == currentUserId)
                return false;

            _context.GroupMembers.Remove(member);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<object> GetGroupStatisticsAsync(string groupId, string currentUserId)
        {
            if (!await CanUserAccessGroupAsync(groupId, currentUserId))
                return new { };

            var group = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.SharedFiles)
                .FirstOrDefaultAsync(g => g.Id == groupId && g.Status == "active");

            if (group == null) return new { };

            return new
            {
                TotalMembers = group.Members.Count(m => m.Status == "active"),
                TotalFiles = group.SharedFiles.Count(f => f.Status == "active"),
                CreatedAt = group.CreatedAt,
                LastActivity = group.UpdatedAt ?? group.CreatedAt
            };
        }

        public async Task<List<GroupDto>> GetUserGroupsAsync(string currentUserId)
        {
            var memberGroups = await _context.GroupMembers
                .Include(m => m.Group)
                    .ThenInclude(g => g.Creator)
                .Include(m => m.Group.Members)
                    .ThenInclude(gm => gm.Employee)
                .Where(m => m.EmployeeId == currentUserId && m.Status == "active")
                .Select(m => m.Group)
                .Where(g => g.Status == "active")
                .OrderByDescending(g => g.CreatedAt)
                .ToListAsync();

            var result = new List<GroupDto>();
            foreach (var group in memberGroups)
            {
                result.Add(await MapToGroupDtoAsync(group, currentUserId));
            }

            return result;
        }

        public async Task<bool> CanUserAccessGroupAsync(string groupId, string currentUserId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId && g.Status == "active");

            if (group == null) return false;

            // Public groups are accessible to all
            if (group.Visibility == "public") return true;

            // Creator always has access
            if (group.CreatorId == currentUserId) return true;

            // Members have access
            return group.Members.Any(m => m.EmployeeId == currentUserId && m.Status == "active");
        }

        public async Task<bool> CanUserManageGroupAsync(string groupId, string currentUserId)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId && g.Status == "active");

            if (group == null) return false;

            // Creator can always manage
            if (group.CreatorId == currentUserId) return true;

            // Admin members can manage
            var member = group.Members.FirstOrDefault(m => m.EmployeeId == currentUserId && m.Status == "active");
            return member?.Role == "admin" || member?.Role == "moderator";
        }

        private async Task<GroupDto> MapToGroupDtoAsync(Group group, string currentUserId)
        {
            var userMember = group.Members.FirstOrDefault(m => m.EmployeeId == currentUserId && m.Status == "active");

            return new GroupDto
            {
                Id = group.Id,
                Name = group.Name,
                Description = group.Description,
                Type = group.Type,
                CreatorId = group.CreatorId,
                CreatorName = group.Creator?.Name ?? "Unknown",
                Status = group.Status,
                Visibility = group.Visibility,
                Avatar = group.Avatar,
                MaxMembers = group.MaxMembers,
                CurrentMemberCount = group.Members.Count(m => m.Status == "active"),
                AllowFileSharing = group.AllowFileSharing,
                AllowMemberInvite = group.AllowMemberInvite,
                CreatedAt = group.CreatedAt,
                UpdatedAt = group.UpdatedAt,
                Members = group.Members.Where(m => m.Status == "active").Select(m => new GroupMemberDto
                {
                    Id = m.Id,
                    EmployeeId = m.EmployeeId,
                    EmployeeName = m.Employee?.Name ?? "Unknown",
                    EmployeeEmail = m.Employee?.Email ?? "",
                    EmployeePosition = m.Employee?.Position ?? "",
                    EmployeeAvatar = m.Employee?.ProfileImageUrl,
                    Role = m.Role,
                    Status = m.Status,
                    JoinedAt = m.JoinedAt
                }).ToList(),
                IsUserMember = userMember != null,
                UserRole = userMember?.Role
            };
        }
    }
}