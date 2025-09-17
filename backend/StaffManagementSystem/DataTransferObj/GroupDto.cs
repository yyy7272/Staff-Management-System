namespace StaffManagementSystem.DataTransferObj
{
    public class GroupDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = "project";
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string Status { get; set; } = "active";
        public string Visibility { get; set; } = "private";
        public string? Avatar { get; set; }
        public int MaxMembers { get; set; } = 100;
        public int CurrentMemberCount { get; set; }
        public bool AllowFileSharing { get; set; } = true;
        public bool AllowMemberInvite { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<GroupMemberDto> Members { get; set; } = new();
        public bool IsUserMember { get; set; }
        public string? UserRole { get; set; }
    }

    public class CreateGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = "project";
        public string Visibility { get; set; } = "private";
        public int MaxMembers { get; set; } = 100;
        public bool AllowFileSharing { get; set; } = true;
        public bool AllowMemberInvite { get; set; } = false;
        public List<string> InitialMembers { get; set; } = new();
    }

    public class UpdateGroupDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Visibility { get; set; }
        public int? MaxMembers { get; set; }
        public bool? AllowFileSharing { get; set; }
        public bool? AllowMemberInvite { get; set; }
    }

    public class GroupMemberDto
    {
        public string Id { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public string EmployeePosition { get; set; } = string.Empty;
        public string? EmployeeAvatar { get; set; }
        public string Role { get; set; } = "member";
        public string Status { get; set; } = "active";
        public DateTime JoinedAt { get; set; }
    }

    public class AddGroupMemberDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
    }

    public class UpdateGroupMemberDto
    {
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}