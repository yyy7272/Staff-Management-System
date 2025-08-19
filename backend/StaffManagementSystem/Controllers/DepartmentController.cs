using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly StaffDbContext _context;

        public DepartmentController(StaffDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var departments = await _context.Departments
                .Include(d => d.Employees)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Description,
                    d.CreatedAt,
                    d.UpdatedAt,
                    EmployeeCount = d.Employees.Count,
                    ActiveEmployeeCount = d.Employees.Count(e => e.Status == "active")
                })
                .OrderBy(d => d.Name)
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(string id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Description,
                    d.CreatedAt,
                    d.UpdatedAt,
                    Employees = d.Employees.Select(e => new
                    {
                        e.Id,
                        e.Name,
                        e.Email,
                        e.Position,
                        e.Status
                    }).ToList(),
                    EmployeeCount = d.Employees.Count,
                    ActiveEmployeeCount = d.Employees.Count(e => e.Status == "active")
                })
                .FirstOrDefaultAsync();

            if (department == null)
            {
                return NotFound();
            }

            return Ok(department);
        }

        [HttpPost]
        public async Task<ActionResult<object>> Create(CreateDepartmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var department = new Department
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateDepartmentRequest request)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            department.Name = request.Name ?? department.Name;
            department.Description = request.Description ?? department.Description;
            department.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id))
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
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound();
            }

            // Prevent deletion of departments with active employees
            if (department.Employees != null && department.Employees.Any(e => e.Status == "active"))
            {
                return BadRequest("Cannot delete department with active employees.");
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            var totalDepartments = await _context.Departments.CountAsync();
            
            var departmentStats = await _context.Departments
                .Include(d => d.Employees)
                .Select(d => new
                {
                    DepartmentName = d.Name,
                    TotalEmployees = d.Employees.Count,
                    ActiveEmployees = d.Employees.Count(e => e.Status == "active"),
                    AverageSalary = d.Employees.Where(e => e.Salary.HasValue).Average(e => e.Salary.Value),
                    LatestHire = d.Employees.Where(e => e.HireDate.HasValue).Max(e => e.HireDate.Value)
                })
                .ToListAsync();

            var largestDepartment = departmentStats
                .OrderByDescending(d => d.TotalEmployees)
                .FirstOrDefault();

            var totalEmployeesAcrossAllDepartments = departmentStats.Sum(d => d.TotalEmployees);
            var totalActiveEmployeesAcrossAllDepartments = departmentStats.Sum(d => d.ActiveEmployees);

            return Ok(new
            {
                totalDepartments,
                totalEmployeesAcrossAllDepartments,
                totalActiveEmployeesAcrossAllDepartments,
                largestDepartment = largestDepartment?.DepartmentName,
                largestDepartmentSize = largestDepartment?.TotalEmployees ?? 0,
                departmentBreakdown = departmentStats.Select(d => new
                {
                    d.DepartmentName,
                    d.TotalEmployees,
                    d.ActiveEmployees,
                    AverageSalary = Math.Round(d.AverageSalary, 2)
                })
            });
        }

        [HttpGet("{id}/employees")]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartmentEmployees(string id, [FromQuery] string? status = null)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            var query = _context.Employees
                .Where(e => e.DepartmentId == id);

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
                    e.Salary,
                    e.Status,
                    e.HireDate,
                    e.CreatedAt
                })
                .OrderBy(e => e.Name)
                .ToListAsync();

            return Ok(employees);
        }

        private bool DepartmentExists(string id)
        {
            return _context.Departments.Any(d => d.Id == id);
        }
    }

    public class CreateDepartmentRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateDepartmentRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}
