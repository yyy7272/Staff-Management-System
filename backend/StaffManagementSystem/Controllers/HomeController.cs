using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StaffManagementSystem.Services;

namespace StaffManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly IActivityService _activityService;

        public HomeController(IActivityService activityService)
        {
            _activityService = activityService;
        }

        [HttpGet("recent-activities")]
        public async Task<ActionResult<object>> GetRecentActivities([FromQuery] int count = 10)
        {
            try
            {
                var activities = await _activityService.GetRecentActivitiesAsync(count);
                
                var result = activities.Select(a => new
                {
                    id = a.Id,
                    type = a.Type,
                    action = a.Action,
                    description = a.Description,
                    entityName = a.EntityName,
                    entityId = a.EntityId,
                    userName = a.UserName,
                    createdAt = a.CreatedAt,
                    timeAgo = GetTimeAgo(a.CreatedAt)
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve recent activities", error = ex.Message });
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