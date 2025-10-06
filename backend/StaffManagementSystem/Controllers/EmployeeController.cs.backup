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
    public class EmployeeController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly IImageProcessingService _imageProcessingService;
        private readonly IWebHostEnvironment _environment;
        private readonly IActivityService _activityService;

        public EmployeeController(StaffDbContext context, IImageProcessingService imageProcessingService, IWebHostEnvironment environment, IActivityService activityService)
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
            var query = _context.Employees
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

            var employees = await query
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
                data = employees,
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
            var employee = await _context.Employees
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

            if (employee == null)
            {
                return NotFound();
            }

            return Ok(employee);
        }

        [HttpPost]
        public async Task<ActionResult<object>> Create(CreateEmployeeRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var employee = new Employee
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

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateEmployeeRequest request)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound();
            }

            employee.Name = request.Name ?? employee.Name;
            employee.Email = request.Email ?? employee.Email;
            employee.Position = request.Position ?? employee.Position;
            employee.Phone = request.Phone ?? employee.Phone;
            employee.Address = request.Address ?? employee.Address;
            employee.Salary = request.Salary ?? employee.Salary;
            employee.Status = request.Status ?? employee.Status;
            employee.DepartmentId = request.DepartmentId ?? employee.DepartmentId;
            employee.HireDate = request.HireDate ?? employee.HireDate;
            employee.ProfileImageUrl = request.PhotoUrl ?? employee.ProfileImageUrl;
            employee.ThumbnailImageUrl = request.Avatar ?? employee.ThumbnailImageUrl;
            employee.UpdatedAt = DateTime.UtcNow;

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
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound();
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("bulk-delete")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
        {
            var employees = await _context.Employees
                .Where(e => request.Ids.Contains(e.Id))
                .ToListAsync();

            if (employees.Count == 0)
            {
                return NotFound("No employees found for the provided IDs");
            }

            _context.Employees.RemoveRange(employees);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Successfully deleted {employees.Count} employees" });
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] string? format = "csv", [FromQuery] string? departmentId = null, [FromQuery] string? status = null)
        {
            var query = _context.Employees
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

            var employees = await query
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
                
                foreach (var emp in employees)
                {
                    csv.AppendLine($"{emp.Id},{emp.Name},{emp.Email},{emp.Position},{emp.Phone},{emp.Address},{emp.Salary},{emp.Status},{emp.HireDate},{emp.DepartmentName},{emp.CreatedAt}");
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", "employees.csv");
            }

            return Ok(employees);
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            var now = DateTime.UtcNow;
            var currentMonth = new DateTime(now.Year, now.Month, 1);
            var lastMonth = currentMonth.AddMonths(-1);
            var lastMonthEnd = currentMonth.AddDays(-1);

            // Current month statistics
            var totalEmployees = await _context.Employees.CountAsync();
            var activeEmployees = await _context.Employees.CountAsync(e => e.Status == "active");
            var inactiveEmployees = await _context.Employees.CountAsync(e => e.Status == "inactive");

            // Calculate trends compared to last month
            var currentMonthEmployees = await _context.Employees
                .CountAsync(e => e.CreatedAt >= currentMonth);

            var lastMonthEmployees = await _context.Employees
                .CountAsync(e => e.CreatedAt >= lastMonth && e.CreatedAt <= lastMonthEnd);

            var currentMonthActiveEmployees = await _context.Employees
                .CountAsync(e => e.Status == "active" && e.CreatedAt >= currentMonth);

            var lastMonthActiveEmployees = await _context.Employees
                .CountAsync(e => e.Status == "active" && e.CreatedAt >= lastMonth && e.CreatedAt <= lastMonthEnd);

            // Calculate percentage changes
            var totalEmployeesTrend = CalculatePercentageChange(lastMonthEmployees, currentMonthEmployees);
            var activeEmployeesTrend = CalculatePercentageChange(lastMonthActiveEmployees, currentMonthActiveEmployees);

            var byDepartment = await _context.Employees
                .Include(e => e.Department)
                .GroupBy(e => e.Department.Name)
                .Select(g => new { Department = g.Key, Count = g.Count() })
                .ToListAsync();

            var byStatus = await _context.Employees
                .GroupBy(e => e.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var recentHires = await _context.Employees
                .Where(e => e.HireDate.HasValue && e.HireDate.Value >= DateTime.UtcNow.AddMonths(-3))
                .CountAsync();

            var averageSalary = await _context.Employees
                .Where(e => e.Salary.HasValue)
                .AnyAsync() 
                ? await _context.Employees
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
            return _context.Employees.Any(e => e.Id == id);
        }

        [HttpPost("{id}/avatar")]
        public async Task<IActionResult> UploadAvatar(string id, IFormFile file)
        {
            if (!EmployeeExists(id))
                return NotFound("Employee not found");

            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            if (!_imageProcessingService.IsValidImageFile(file))
                return BadRequest("Invalid image file. Please upload a valid image (JPG, PNG, GIF, WebP) under 5MB");

            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                    return NotFound("Employee not found");

                // Delete existing avatar if any
                if (!string.IsNullOrEmpty(employee.ProfileImagePath))
                {
                    await _imageProcessingService.DeleteAvatarAsync(employee.ProfileImagePath);
                }

                // Process and save new avatar
                var (originalPath, thumbnailPath) = await _imageProcessingService.ProcessAvatarAsync(file, id);

                // Generate URLs for the images
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var originalUrl = $"{baseUrl}/uploads/avatars/{Path.GetFileName(originalPath)}";
                var thumbnailUrl = $"{baseUrl}/uploads/avatars/{Path.GetFileName(thumbnailPath)}";

                // Update employee record
                employee.ProfileImagePath = originalPath;
                employee.ProfileImageUrl = originalUrl;
                employee.ThumbnailImagePath = thumbnailPath;
                employee.ThumbnailImageUrl = thumbnailUrl;
                employee.UpdatedAt = DateTime.UtcNow;

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
                return NotFound("Employee not found");

            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                    return NotFound("Employee not found");

                if (!string.IsNullOrEmpty(employee.ProfileImagePath))
                {
                    await _imageProcessingService.DeleteAvatarAsync(employee.ProfileImagePath);
                    
                    employee.ProfileImagePath = null;
                    employee.ProfileImageUrl = null;
                    employee.ThumbnailImagePath = null;
                    employee.ThumbnailImageUrl = null;
                    employee.UpdatedAt = DateTime.UtcNow;

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