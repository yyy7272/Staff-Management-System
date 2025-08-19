using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.Services;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication
    public class PayrollController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly IActivityService _activityService;
        private readonly ILogger<PayrollController> _logger;

        public PayrollController(StaffDbContext context, IActivityService activityService, ILogger<PayrollController> logger)
        {
            _context = context;
            _activityService = activityService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            var query = _context.Payrolls
                .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(p => p.Status == status);
            }

            var totalCount = await query.CountAsync();
            var payrolls = await query
                .OrderByDescending(p => p.PayPeriodEnd)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(p => new
                {
                    p.Id,
                    p.PayPeriodStart,
                    p.PayPeriodEnd,
                    p.BaseSalary,
                    p.Overtime,
                    p.Bonus,
                    p.Deductions,
                    p.TaxWithholding,
                    p.NetPay,
                    p.Status,
                    p.Notes,
                    p.CreatedAt,
                    p.ProcessedBy,
                    p.ProcessedAt,
                    Employee = new
                    {
                        p.Employee.Id,
                        p.Employee.Name,
                        p.Employee.Email,
                        p.Employee.Position,
                        Department = p.Employee.Department.Name
                    }
                })
                .ToListAsync();

            await _activityService.LogActivityAsync("payroll", "viewed", 
                $"Viewed payroll records (page {page})", "Payroll", null, currentUser.Id, currentUser.Username);

            return Ok(new
            {
                data = payrolls,
                pagination = new
                {
                    page,
                    limit,
                    total = totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / limit)
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(string id)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            var payroll = await _context.Payrolls
                .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.PayPeriodStart,
                    p.PayPeriodEnd,
                    p.BaseSalary,
                    p.Overtime,
                    p.Bonus,
                    p.Deductions,
                    p.TaxWithholding,
                    p.NetPay,
                    p.Status,
                    p.Notes,
                    p.CreatedAt,
                    p.UpdatedAt,
                    p.ProcessedBy,
                    p.ProcessedAt,
                    Employee = new
                    {
                        p.Employee.Id,
                        p.Employee.Name,
                        p.Employee.Email,
                        p.Employee.Position,
                        Department = p.Employee.Department.Name
                    }
                })
                .FirstOrDefaultAsync();

            if (payroll == null)
            {
                return NotFound("Payroll record not found.");
            }

            await _activityService.LogActivityAsync("payroll", "viewed", 
                $"Viewed payroll record for {payroll.Employee.Name}", "Payroll", id, currentUser.Id, currentUser.Username);

            return Ok(payroll);
        }

        [HttpPost]
        public async Task<ActionResult<object>> Create([FromBody] CreatePayrollDto dto)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            // Validate employee exists
            var employee = await _context.Employees.FindAsync(dto.EmployeeId);
            if (employee == null)
            {
                return BadRequest("Employee not found.");
            }

            // Check for overlapping pay periods
            var hasOverlap = await _context.Payrolls
                .AnyAsync(p => p.EmployeeId == dto.EmployeeId &&
                             p.Id != dto.Id &&
                             ((dto.PayPeriodStart >= p.PayPeriodStart && dto.PayPeriodStart <= p.PayPeriodEnd) ||
                              (dto.PayPeriodEnd >= p.PayPeriodStart && dto.PayPeriodEnd <= p.PayPeriodEnd) ||
                              (dto.PayPeriodStart <= p.PayPeriodStart && dto.PayPeriodEnd >= p.PayPeriodEnd)));

            if (hasOverlap)
            {
                return BadRequest("Pay period overlaps with existing payroll record.");
            }

            var payroll = new Payroll
            {
                EmployeeId = dto.EmployeeId,
                PayPeriodStart = dto.PayPeriodStart,
                PayPeriodEnd = dto.PayPeriodEnd,
                BaseSalary = dto.BaseSalary,
                Overtime = dto.Overtime,
                Bonus = dto.Bonus,
                Deductions = dto.Deductions,
                TaxWithholding = dto.TaxWithholding,
                Status = "draft",
                Notes = dto.Notes
            };

            payroll.CalculateNetPay();

            _context.Payrolls.Add(payroll);
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync("payroll", "created", 
                $"Created payroll record for {employee.Name}", "Payroll", payroll.Id, currentUser.Id, currentUser.Username);

            return Ok(new { id = payroll.Id, message = "Payroll record created successfully." });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<object>> Update(string id, [FromBody] UpdatePayrollDto dto)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            var payroll = await _context.Payrolls.FindAsync(id);
            if (payroll == null)
            {
                return NotFound("Payroll record not found.");
            }

            // Don't allow editing processed/paid payrolls unless admin
            if (payroll.Status != "draft" && !currentUser.IsAdministrator)
            {
                return BadRequest("Cannot modify processed or paid payroll records.");
            }

            // Update fields
            payroll.BaseSalary = dto.BaseSalary;
            payroll.Overtime = dto.Overtime;
            payroll.Bonus = dto.Bonus;
            payroll.Deductions = dto.Deductions;
            payroll.TaxWithholding = dto.TaxWithholding;
            payroll.Notes = dto.Notes;
            payroll.UpdatedAt = DateTime.UtcNow;

            payroll.CalculateNetPay();

            await _context.SaveChangesAsync();

            var employee = await _context.Employees.FindAsync(payroll.EmployeeId);
            await _activityService.LogActivityAsync("payroll", "updated", 
                $"Updated payroll record for {employee?.Name}", "Payroll", id, currentUser.Id, currentUser.Username);

            return Ok(new { message = "Payroll record updated successfully." });
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<object>> UpdateStatus(string id, [FromBody] UpdatePayrollStatusDto dto)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            var payroll = await _context.Payrolls
                .Include(p => p.Employee)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payroll == null)
            {
                return NotFound("Payroll record not found.");
            }

            var validStatuses = new[] { "draft", "processed", "paid" };
            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest("Invalid status. Valid statuses are: draft, processed, paid.");
            }

            payroll.Status = dto.Status;
            payroll.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == "processed" || dto.Status == "paid")
            {
                payroll.ProcessedBy = currentUser.Username;
                payroll.ProcessedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync("payroll", "status_updated", 
                $"Changed payroll status to {dto.Status} for {payroll.Employee.Name}", "Payroll", id, currentUser.Id, currentUser.Username);

            return Ok(new { message = $"Payroll status updated to {dto.Status}." });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<object>> Delete(string id)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !currentUser.IsAdministrator)
            {
                return Forbid("Access denied. Administrator privileges required.");
            }

            var payroll = await _context.Payrolls
                .Include(p => p.Employee)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payroll == null)
            {
                return NotFound("Payroll record not found.");
            }

            _context.Payrolls.Remove(payroll);
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync("payroll", "deleted", 
                $"Deleted payroll record for {payroll.Employee.Name}", "Payroll", id, currentUser.Id, currentUser.Username);

            return Ok(new { message = "Payroll record deleted successfully." });
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null || !await HasPayrollAccessAsync(currentUser))
            {
                return Forbid("Access denied. Administrator or HR privileges required.");
            }

            var now = DateTime.UtcNow;
            var currentMonth = new DateTime(now.Year, now.Month, 1);
            var lastMonth = currentMonth.AddMonths(-1);
            var lastMonthEnd = currentMonth.AddDays(-1);

            // Current month statistics
            var totalRecords = await _context.Payrolls.CountAsync();
            var draftRecords = await _context.Payrolls.CountAsync(p => p.Status == "draft");
            var processedRecords = await _context.Payrolls.CountAsync(p => p.Status == "processed");
            var paidRecords = await _context.Payrolls.CountAsync(p => p.Status == "paid");

            var totalPayroll = await _context.Payrolls
                .Where(p => p.Status == "paid")
                .SumAsync(p => p.NetPay);

            var averagePayroll = await _context.Payrolls
                .Where(p => p.Status == "paid")
                .AverageAsync(p => (double?)p.NetPay) ?? 0;

            // Calculate trends compared to last month
            var currentMonthPayroll = await _context.Payrolls
                .Where(p => p.Status == "paid" && p.CreatedAt >= currentMonth)
                .SumAsync(p => p.NetPay);

            var lastMonthPayroll = await _context.Payrolls
                .Where(p => p.Status == "paid" && p.CreatedAt >= lastMonth && p.CreatedAt <= lastMonthEnd)
                .SumAsync(p => p.NetPay);

            var currentMonthAverage = await _context.Payrolls
                .Where(p => p.Status == "paid" && p.CreatedAt >= currentMonth)
                .AverageAsync(p => (double?)p.NetPay) ?? 0;

            var lastMonthAverage = await _context.Payrolls
                .Where(p => p.Status == "paid" && p.CreatedAt >= lastMonth && p.CreatedAt <= lastMonthEnd)
                .AverageAsync(p => (double?)p.NetPay) ?? 0;

            var currentMonthRecords = await _context.Payrolls
                .Where(p => p.CreatedAt >= currentMonth)
                .CountAsync();

            var lastMonthRecords = await _context.Payrolls
                .Where(p => p.CreatedAt >= lastMonth && p.CreatedAt <= lastMonthEnd)
                .CountAsync();

            var currentMonthProcessed = await _context.Payrolls
                .Where(p => p.Status == "processed" && p.CreatedAt >= currentMonth)
                .CountAsync();

            var lastMonthProcessed = await _context.Payrolls
                .Where(p => p.Status == "processed" && p.CreatedAt >= lastMonth && p.CreatedAt <= lastMonthEnd)
                .CountAsync();

            // Calculate percentage changes
            var totalPayrollTrend = CalculatePercentageChange((double)lastMonthPayroll, (double)currentMonthPayroll);
            var averagePayrollTrend = CalculatePercentageChange(lastMonthAverage, currentMonthAverage);
            var totalRecordsTrend = CalculatePercentageChange(lastMonthRecords, currentMonthRecords);
            var processedRecordsTrend = CalculatePercentageChange(lastMonthProcessed, currentMonthProcessed);

            return Ok(new
            {
                totalRecords,
                draftRecords,
                processedRecords,
                paidRecords,
                totalPayroll,
                averagePayroll,
                trends = new
                {
                    totalPayrollTrend = new
                    {
                        value = totalPayrollTrend.Value,
                        isPositive = totalPayrollTrend.IsPositive,
                        text = totalPayrollTrend.Text
                    },
                    averagePayrollTrend = new
                    {
                        value = averagePayrollTrend.Value,
                        isPositive = averagePayrollTrend.IsPositive,
                        text = averagePayrollTrend.Text
                    },
                    totalRecordsTrend = new
                    {
                        value = totalRecordsTrend.Value,
                        isPositive = totalRecordsTrend.IsPositive,
                        text = totalRecordsTrend.Text
                    },
                    processedRecordsTrend = new
                    {
                        value = processedRecordsTrend.Value,
                        isPositive = processedRecordsTrend.IsPositive,
                        text = processedRecordsTrend.Text
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

        private async Task<User?> GetCurrentUserAsync()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
                return null;

            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        private async Task<bool> HasPayrollAccessAsync(User user)
        {
            // Administrators have full access
            if (user.IsAdministrator)
                return true;

            // Check if user is in HR department or has HR role
            // This is a simplified check - you can expand this based on your business logic
            var employee = await _context.Employees
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Email == user.Email);

            if (employee?.Department?.Name == "Human Resources")
                return true;

            // You can add more role-based checks here
            return false;
        }
    }

    public class CreatePayrollDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public DateTime PayPeriodStart { get; set; }
        public DateTime PayPeriodEnd { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal Overtime { get; set; } = 0;
        public decimal Bonus { get; set; } = 0;
        public decimal Deductions { get; set; } = 0;
        public decimal TaxWithholding { get; set; } = 0;
        public string? Notes { get; set; }
        public string? Id { get; set; } // For overlap checking
    }

    public class UpdatePayrollDto
    {
        public decimal BaseSalary { get; set; }
        public decimal Overtime { get; set; } = 0;
        public decimal Bonus { get; set; } = 0;
        public decimal Deductions { get; set; } = 0;
        public decimal TaxWithholding { get; set; } = 0;
        public string? Notes { get; set; }
    }

    public class UpdatePayrollStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}