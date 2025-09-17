using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StaffManagementSystem.Services;
using StaffManagementSystem.DataTransferObj;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GroupController : ControllerBase
    {
        private readonly IGroupService _groupService;
        private readonly ILogger<GroupController> _logger;

        public GroupController(IGroupService groupService, ILogger<GroupController> logger)
        {
            _groupService = groupService;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        [HttpGet]
        public async Task<IActionResult> GetGroups([FromQuery] string? type = null, [FromQuery] string? visibility = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var groups = await _groupService.GetGroupsAsync(currentUserId, type, visibility);
                return Ok(new { success = true, data = groups });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting groups");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGroup(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var group = await _groupService.GetGroupByIdAsync(id, currentUserId);

                if (group == null)
                    return NotFound(new { success = false, message = "Group not found or access denied" });

                return Ok(new { success = true, data = group });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var group = await _groupService.CreateGroupAsync(dto, currentUserId);

                return Ok(new { success = true, data = group, message = "Group created successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGroup(string id, [FromBody] UpdateGroupDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var group = await _groupService.UpdateGroupAsync(id, dto, currentUserId);

                if (group == null)
                    return NotFound(new { success = false, message = "Group not found or access denied" });

                return Ok(new { success = true, data = group, message = "Group updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _groupService.DeleteGroupAsync(id, currentUserId);

                if (!success)
                    return NotFound(new { success = false, message = "Group not found or access denied" });

                return Ok(new { success = true, message = "Group deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetGroupMembers(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var members = await _groupService.GetGroupMembersAsync(id, currentUserId);
                return Ok(new { success = true, data = members });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group members for {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddGroupMember(string id, [FromBody] AddGroupMemberDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var success = await _groupService.AddMemberAsync(id, dto, currentUserId);

                if (!success)
                    return BadRequest(new { success = false, message = "Failed to add member" });

                return Ok(new { success = true, message = "Member added successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding member to group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("{id}/members/{memberId}")]
        public async Task<IActionResult> RemoveGroupMember(string id, string memberId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _groupService.RemoveMemberAsync(id, memberId, currentUserId);

                if (!success)
                    return BadRequest(new { success = false, message = "Failed to remove member" });

                return Ok(new { success = true, message = "Member removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing member from group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPut("{id}/members/{memberId}")]
        public async Task<IActionResult> UpdateGroupMember(string id, string memberId, [FromBody] UpdateGroupMemberDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var success = await _groupService.UpdateMemberRoleAsync(id, memberId, dto, currentUserId);

                if (!success)
                    return BadRequest(new { success = false, message = "Failed to update member role" });

                return Ok(new { success = true, message = "Member role updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating member role in group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("public")]
        public async Task<IActionResult> GetPublicGroups()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var groups = await _groupService.GetPublicGroupsAsync(currentUserId);
                return Ok(new { success = true, data = groups });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public groups");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("department/{departmentId}")]
        public async Task<IActionResult> GetDepartmentGroups(string departmentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var groups = await _groupService.GetDepartmentGroupsAsync(departmentId, currentUserId);
                return Ok(new { success = true, data = groups });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting department groups");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("{id}/join")]
        public async Task<IActionResult> JoinGroup(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _groupService.RequestJoinGroupAsync(id, currentUserId);

                if (!success)
                    return BadRequest(new { success = false, message = "Failed to join group" });

                return Ok(new { success = true, message = "Successfully joined group" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("{id}/leave")]
        public async Task<IActionResult> LeaveGroup(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _groupService.LeaveGroupAsync(id, currentUserId);

                if (!success)
                    return BadRequest(new { success = false, message = "Failed to leave group" });

                return Ok(new { success = true, message = "Successfully left group" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving group {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}/statistics")]
        public async Task<IActionResult> GetGroupStatistics(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var stats = await _groupService.GetGroupStatisticsAsync(id, currentUserId);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group statistics {GroupId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("my-groups")]
        public async Task<IActionResult> GetMyGroups()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var groups = await _groupService.GetUserGroupsAsync(currentUserId);
                return Ok(new { success = true, data = groups });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user groups");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}