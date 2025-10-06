using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.Services;
using System.Text;

namespace StaffManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly IImageProcessingService _imageProcessingService;
        private readonly IWebHostEnvironment _environment;
        private readonly IActivityService _activityService;

        public UserController(StaffDbContext context, IImageProcessingService imageProcessingService, IWebHostEnvironment environment, IActivityService activityService)
        {
            _context = context;
            _imageProcessingService = imageProcessingService;
            _environment = environment;
            _activityService = activityService;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetAll(
            [FromQuery] string? search = null, 
            [FromQuery] string? departmentId = null, 
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            var query = _context.Users
                .Include(e => e.Department)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e => e.Name.Contains(search) || e.Email.Contains(search) || e.Position.Contains(search));
            }

            if (!string.IsNullOrEmpty(departmentId))
            {
                query = query.Where(e => e.DepartmentId == departmentId);
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(e => e.Status == status);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();
            
            // Ensure page and limit are within reasonable bounds
            page = Math.Max(1, page);
            limit = Math.Max(1, Math.Min(100, limit)); // Cap limit at 100
            
            // Calculate pagination
            var skip = (page - 1) * limit;
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);

            var Users = await query
                .Skip(skip)
                .Take(limit)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Email,
                    e.Position,
                    e.Phone,
                    e.Address,
                    e.Salary,
                    e.Status,
                    e.HireDate,
                    e.ProfileImageUrl,
                    e.ThumbnailImageUrl,
                    e.CreatedAt,
                    e.UpdatedAt,
                    Department = e.Department != null ? new { e.Department.Id, e.Department.Name } : null
                })
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                data = Users,
                pagination = new
                {
                    page = page,
                    limit = limit,
                    total = totalCount,
                    totalPages = totalPages,
                    hasNextPage = page < totalPages,
                    hasPreviousPage = page > 1
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(string id)
        {
            var User = await _context.Users
                .Include(e => e.Department)
                .Where(e => e.Id == id)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Email,
                    e.Position,
                    e.Phone,
                    e.Address,
                    e.Salary,
                    e.Status,
                    e.HireDate,
                    e.ProfileImageUrl,
                    e.ThumbnailImageUrl,
                    e.CreatedAt,
                    e.UpdatedAt,
                    Department = e.Department != null ? new { e.Department.Id, e.Department.Name } : null
                })
                .FirstOrDefaultAsync();

            if (User == null)
            {
                return NotFound();
            }

            return Ok(User);
        }

        [HttpPost]
        public async Task<ActionResult<object>> Create(CreateEmployeeRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var User = new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                Email = request.Email,
                Position = request.Position,
                Phone = request.Phone,
                Address = request.Address,
                Salary = request.Salary,
                Status = request.Status ?? "active",
                DepartmentId = request.DepartmentId,
                HireDate = request.HireDate,
                ProfileImageUrl = request.PhotoUrl,
                ThumbnailImageUrl = request.Avatar,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(User);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = User.Id }, User);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateEmployeeRequest request)
        {
            var User = await _context.Users.FindAsync(id);
            if (User == null)
            {
                return NotFound();
            }

            User.Name = request.Name ?? User.Name;
            User.Email = request.Email ?? User.Email;
            User.Position = request.Position ?? User.Position;
            User.Phone = request.Phone ?? User.Phone;
            User.Address = request.Address ?? User.Address;
            User.Salary = request.Salary ?? User.Salary;
            User.Status = request.Status ?? User.Status;
            User.DepartmentId = request.DepartmentId ?? User.DepartmentId;
            User.HireDate = request.HireDate ?? User.HireDate;
            User.ProfileImageUrl = request.PhotoUrl ?? User.ProfileImageUrl;
            User.ThumbnailImageUrl = request.Avatar ?? User.ThumbnailImageUrl;
            User.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmployeeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var User = await _context.Users.FindAsync(id);
            if (User == null)
            {
                return NotFound();
            }

            _context.Users.Remove(User);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("bulk-delete")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
        {
            var Users = await _context.Users
                .Where(e => request.Ids.Contains(e.Id))
                .ToListAsync();

            if (Users.Count == 0)
            {
                return NotFound("No Users found for the provided IDs");
            }

            _context.Users.RemoveRange(Users);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Successfully deleted {Users.Count} Users" });
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] string? format = "csv", [FromQuery] string? departmentId = null, [FromQuery] string? status = null)
        {
            var query = _context.Users
                .Include(e => e.Department)
                .AsQueryable();

            if (!string.IsNullOrEmpty(departmentId))
            {
                query = query.Where(e => e.DepartmentId == departmentId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(e => e.Status == status);
            }

            var Users = await query
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Email,
                    e.Position,
                    e.Phone,
                    e.Address,
                    e.Salary,
                    e.Status,
                    HireDate = e.HireDate != null ? e.HireDate.Value.ToString("yyyy-MM-dd") : null,
                    DepartmentName = e.Department != null ? e.Department.Name : "",
                    CreatedAt = e.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .OrderBy(e => e.Name)
                .ToListAsync();

            if (format?.ToLower() == "csv")
            {
                var csv = new StringBuilder();
                csv.AppendLine("ID,Name,Email,Position,Phone,Address,Salary,Status,HireDate,Department,CreatedAt");
                
                foreach (var emp in Users)
                {
                    csv.AppendLine($"{emp.Id},{emp.Name},{emp.Email},{emp.Position},{emp.Phone},{emp.Address},{emp.Salary},{emp.Status},{emp.HireDate},{emp.DepartmentName},{emp.CreatedAt}");
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", "Users.csv");
            }

            return Ok(Users);
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            var now = DateTime.UtcNow;
            var currentMonth = new DateTime(now.Year, now.Month, 1);
            var lastMonth = currentMonth.AddMonths(-1);
            var lastMonthEnd = currentMonth.AddDays(-1);

            // Current month statistics
            var totalEmployees = await _context.Users.CountAsync();
            var activeEmployees = await _context.Users.CountAsync(e => e.Status == "active");
            var inactiveEmployees = await _context.Users.CountAsync(e => e.Status == "inactive");

            // Calculate trends compared to last month
            var currentMonthEmployees = await _context.Users
                .CountAsync(e => e.CreatedAt >= currentMonth);

            var lastMonthEmployees = await _context.Users
                .CountAsync(e => e.CreatedAt >= lastMonth && e.CreatedAt <= lastMonthEnd);

            var currentMonthActiveEmployees = await _context.Users
                .CountAsync(e => e.Status == "active" && e.CreatedAt >= currentMonth);

            var lastMonthActiveEmployees = await _context.Users
                .CountAsync(e => e.Status == "active" && e.CreatedAt >= lastMonth && e.CreatedAt <= lastMonthEnd);

            // Calculate percentage changes
            var totalEmployeesTrend = CalculatePercentageChange(lastMonthEmployees, currentMonthEmployees);
            var activeEmployeesTrend = CalculatePercentageChange(lastMonthActiveEmployees, currentMonthActiveEmployees);

            var byDepartment = await _context.Users
                .Include(e => e.Department)
                .GroupBy(e => e.Department.Name)
                .Select(g => new { Department = g.Key, Count = g.Count() })
                .ToListAsync();

            var byStatus = await _context.Users
                .GroupBy(e => e.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var recentHires = await _context.Users
                .Where(e => e.HireDate.HasValue && e.HireDate.Value >= DateTime.UtcNow.AddMonths(-3))
                .CountAsync();

            var averageSalary = await _context.Users
                .Where(e => e.Salary.HasValue)
                .AnyAsync() 
                ? await _context.Users
                    .Where(e => e.Salary.HasValue)
                    .AverageAsync(e => e.Salary.Value)
                : 0;

            return Ok(new
            {
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                byDepartment,
                byStatus,
                recentHires,
                averageSalary = Math.Round(averageSalary, 2),
                trends = new
                {
                    totalEmployeesTrend = new
                    {
                        value = totalEmployeesTrend.Value,
                        isPositive = totalEmployeesTrend.IsPositive,
                        text = totalEmployeesTrend.Text
                    },
                    activeEmployeesTrend = new
                    {
                        value = activeEmployeesTrend.Value,
                        isPositive = activeEmployeesTrend.IsPositive,
                        text = activeEmployeesTrend.Text
                    }
                }
            });
        }

        private static (double Value, bool IsPositive, string Text) CalculatePercentageChange(double previous, double current)
        {
            if (previous == 0)
            {
                if (current > 0)
                    return (100, true, "New data available");
                return (0, true, "No change");
            }

            var percentChange = ((current - previous) / previous) * 100;
            var isPositive = percentChange >= 0;
            var text = $"{(isPositive ? "+" : "")}{percentChange:F1}% from last month";
            return (Math.Abs(percentChange), isPositive, text);
        }

        private bool EmployeeExists(string id)
        {
            return _context.Users.Any(e => e.Id == id);
        }

        [HttpPost("{id}/avatar")]
        public async Task<IActionResult> UploadAvatar(string id, IFormFile file)
        {
            if (!EmployeeExists(id))
                return NotFound("User not found");

            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            if (!_imageProcessingService.IsValidImageFile(file))
                return BadRequest("Invalid image file. Please upload a valid image (JPG, PNG, GIF, WebP) under 5MB");

            try
            {
                var User = await _context.Users.FindAsync(id);
                if (User == null)
                    return NotFound("User not found");

                // Delete existing avatar if any
                if (!string.IsNullOrEmpty(User.ProfileImagePath))
                {
                    await _imageProcessingService.DeleteAvatarAsync(User.ProfileImagePath);
                }

                // Process and save new avatar
                var (originalPath, thumbnailPath) = await _imageProcessingService.ProcessAvatarAsync(file, id);

                // Generate URLs for the images
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var originalUrl = $"{baseUrl}/uploads/avatars/{Path.GetFileName(originalPath)}";
                var thumbnailUrl = $"{baseUrl}/uploads/avatars/{Path.GetFileName(thumbnailPath)}";

                // Update User record
                User.ProfileImagePath = originalPath;
                User.ProfileImageUrl = originalUrl;
                User.ThumbnailImagePath = thumbnailPath;
                User.ThumbnailImageUrl = thumbnailUrl;
                User.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Avatar uploaded successfully",
                    profileImageUrl = originalUrl,
                    thumbnailImageUrl = thumbnailUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error uploading avatar: {ex.Message}");
            }
        }

        [HttpDelete("{id}/avatar")]
        public async Task<IActionResult> DeleteAvatar(string id)
        {
            if (!EmployeeExists(id))
                return NotFound("User not found");

            try
            {
                var User = await _context.Users.FindAsync(id);
                if (User == null)
                    return NotFound("User not found");

                if (!string.IsNullOrEmpty(User.ProfileImagePath))
                {
                    await _imageProcessingService.DeleteAvatarAsync(User.ProfileImagePath);
                    
                    User.ProfileImagePath = null;
                    User.ProfileImageUrl = null;
                    User.ThumbnailImagePath = null;
                    User.ThumbnailImageUrl = null;
                    User.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Avatar deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting avatar: {ex.Message}");
            }
        }
    }

    public class CreateEmployeeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public decimal? Salary { get; set; }
        public string? Status { get; set; }
        public string DepartmentId { get; set; } = string.Empty;
        public DateTime? HireDate { get; set; }
        public string? PhotoUrl { get; set; }
        public string? Avatar { get; set; }
    }

    public class UpdateEmployeeRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Position { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public decimal? Salary { get; set; }
        public string? Status { get; set; }
        public string? DepartmentId { get; set; }
        public DateTime? HireDate { get; set; }
        public string? PhotoUrl { get; set; }
        public string? Avatar { get; set; }
    }

    public class BulkDeleteRequest
    {
        public List<string> Ids { get; set; } = new();
    }
}