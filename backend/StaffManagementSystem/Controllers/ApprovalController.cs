using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.DataTransferObj;
using StaffManagementSystem.Services;

namespace StaffManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ApprovalController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly IActivityService _activityService;
        private readonly INotificationService _notificationService;

        public ApprovalController(StaffDbContext context, IActivityService activityService, INotificationService notificationService)
        {
            _context = context;
            _activityService = activityService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetApprovals([FromQuery] string? status = null, [FromQuery] string? type = null)
        {
            var query = _context.Approvals
                .Include(a => a.Applicant)
                .Include(a => a.Approver)
                .Include(a => a.Department)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(a => a.Type == type);
            }

            var approvals = await query
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Type,
                    a.Priority,
                    a.Status,
                    a.RequestDate,
                    a.ResponseDate,
                    a.DueDate,
                    a.ApprovalNotes,
                    a.Amount,
                    a.CreatedAt,
                    a.UpdatedAt,
                    Applicant = new { a.Applicant.Id, a.Applicant.Name, a.Applicant.Email },
                    Approver = a.Approver != null ? new { a.Approver.Id, a.Approver.Name, a.Approver.Email } : null,
                    Department = a.Department != null ? new { a.Department.Id, a.Department.Name } : null
                })
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(approvals);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetApproval(string id)
        {
            var approval = await _context.Approvals
                .Include(a => a.Applicant)
                .Include(a => a.Approver)
                .Include(a => a.Department)
                .Where(a => a.Id == id)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Type,
                    a.Priority,
                    a.Status,
                    a.RequestDate,
                    a.ResponseDate,
                    a.DueDate,
                    a.ApprovalNotes,
                    a.Amount,
                    a.CreatedAt,
                    a.UpdatedAt,
                    Applicant = new { a.Applicant.Id, a.Applicant.Name, a.Applicant.Email },
                    Approver = a.Approver != null ? new { a.Approver.Id, a.Approver.Name, a.Approver.Email } : null,
                    Department = a.Department != null ? new { a.Department.Id, a.Department.Name } : null
                })
                .FirstOrDefaultAsync();

            if (approval == null)
            {
                return NotFound();
            }

            return Ok(approval);
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateApproval(CreateApprovalDto approvalDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get current user info
            var currentUsername = User.Identity?.Name;
            if (string.IsNullOrEmpty(currentUsername))
            {
                return Unauthorized("User not authenticated");
            }

            // Try to find an employee matching the current user
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == $"{currentUsername}@company.com" || e.Name.ToLower().Contains(currentUsername.ToLower()));

            // If no employee found, create a temporary one for demo purposes
            if (employee == null)
            {
                // Check if there's a default department
                var defaultDepartment = await _context.Departments.FirstOrDefaultAsync();
                if (defaultDepartment == null)
                {
                    // Create a default department if none exists
                    defaultDepartment = new Department
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "General",
                        Description = "Default department for system users",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Departments.Add(defaultDepartment);
                    await _context.SaveChangesAsync();
                }

                employee = new Employee
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = currentUsername,
                    Email = $"{currentUsername}@company.com",
                    Position = "System User",
                    DepartmentId = defaultDepartment.Id,
                    Status = "active",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();
            }

            // Create the approval
            var approval = new Approval
            {
                Id = Guid.NewGuid().ToString(),
                Title = approvalDto.Title,
                Description = approvalDto.Description,
                Type = approvalDto.Type,
                Priority = approvalDto.Priority,
                Status = "pending",
                ApplicantId = employee.Id,
                Amount = approvalDto.Amount,
                DueDate = approvalDto.DueDate,
                RequestDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Approvals.Add(approval);
            await _context.SaveChangesAsync();

            // Log activity
            await _activityService.LogActivityAsync(
                "approval", 
                "created", 
                $"New {approval.Type} request created: {approval.Title}",
                approval.Title,
                approval.Id
            );

            // Create notification for admins (for now, we'll send to all admins)
            var adminUsers = await _context.Users
                .Where(u => u.IsAdministrator && u.IsActive)
                .ToListAsync();

            foreach (var admin in adminUsers)
            {
                await _notificationService.CreateNotificationAsync(
                    "approval",
                    "New Approval Request",
                    $"New {approval.Type} request from {employee.Name}: {approval.Title}",
                    admin.Id,
                    GetPriorityFromApprovalPriority(approval.Priority),
                    "approval",
                    approval.Id
                );
            }

            // Return the created approval with related data (same structure as GetApprovals)
            var result = await _context.Approvals
                .Include(a => a.Applicant)
                .Include(a => a.Approver)
                .Include(a => a.Department)
                .Where(a => a.Id == approval.Id)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Type,
                    a.Priority,
                    a.Status,
                    a.RequestDate,
                    a.ResponseDate,
                    a.DueDate,
                    a.ApprovalNotes,
                    a.Amount,
                    a.CreatedAt,
                    a.UpdatedAt,
                    Applicant = new { a.Applicant.Id, a.Applicant.Name, a.Applicant.Email },
                    Approver = a.Approver != null ? new { a.Approver.Id, a.Approver.Name, a.Approver.Email } : null,
                    Department = a.Department != null ? new { a.Department.Id, a.Department.Name } : null
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetApproval), new { id = approval.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateApproval(string id, Approval approval)
        {
            if (id != approval.Id)
            {
                return BadRequest();
            }

            var existingApproval = await _context.Approvals.FindAsync(id);
            if (existingApproval == null)
            {
                return NotFound();
            }

            existingApproval.Title = approval.Title;
            existingApproval.Description = approval.Description;
            existingApproval.Type = approval.Type;
            existingApproval.Priority = approval.Priority;
            existingApproval.Status = approval.Status;
            existingApproval.ApproverId = approval.ApproverId;
            existingApproval.DepartmentId = approval.DepartmentId;
            existingApproval.ResponseDate = approval.ResponseDate;
            existingApproval.DueDate = approval.DueDate;
            existingApproval.ApprovalNotes = approval.ApprovalNotes;
            existingApproval.Amount = approval.Amount;
            existingApproval.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ApprovalExists(id))
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
        public async Task<IActionResult> DeleteApproval(string id)
        {
            var approval = await _context.Approvals.FindAsync(id);
            if (approval == null)
            {
                return NotFound();
            }

            _context.Approvals.Remove(approval);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(string id, [FromBody] ApprovalDecision decision)
        {
            var approval = await _context.Approvals.FindAsync(id);
            if (approval == null)
            {
                return NotFound();
            }

            approval.Status = "approved";
            approval.ResponseDate = DateTime.UtcNow;
            approval.ApprovalNotes = decision.Notes;
            approval.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            await _activityService.LogActivityAsync(
                "approval", 
                "approved", 
                $"Approved {approval.Type} request: {approval.Title}",
                approval.Title,
                approval.Id
            );

            // Create notification for the applicant (simplified - use current user for demo)
            var currentUserId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (!string.IsNullOrEmpty(currentUserId))
            {
                await _notificationService.CreateNotificationAsync(
                    "success",
                    "Request Approved",
                    $"Your {approval.Type} request '{approval.Title}' has been approved",
                    currentUserId,
                    "medium",
                    "approval",
                    approval.Id
                );
            }

            // Return the updated approval with related data (same structure as GetApprovals)
            var result = await _context.Approvals
                .Include(a => a.Applicant)
                .Include(a => a.Approver)
                .Include(a => a.Department)
                .Where(a => a.Id == approval.Id)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Type,
                    a.Priority,
                    a.Status,
                    a.RequestDate,
                    a.ResponseDate,
                    a.DueDate,
                    a.ApprovalNotes,
                    a.Amount,
                    a.CreatedAt,
                    a.UpdatedAt,
                    Applicant = new { a.Applicant.Id, a.Applicant.Name, a.Applicant.Email },
                    Approver = a.Approver != null ? new { a.Approver.Id, a.Approver.Name, a.Approver.Email } : null,
                    Department = a.Department != null ? new { a.Department.Id, a.Department.Name } : null
                })
                .FirstOrDefaultAsync();

            return Ok(result);
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectRequest(string id, [FromBody] ApprovalDecision decision)
        {
            var approval = await _context.Approvals.FindAsync(id);
            if (approval == null)
            {
                return NotFound();
            }

            approval.Status = "rejected";
            approval.ResponseDate = DateTime.UtcNow;
            approval.ApprovalNotes = decision.Notes;
            approval.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            await _activityService.LogActivityAsync(
                "approval", 
                "rejected", 
                $"Rejected {approval.Type} request: {approval.Title}",
                approval.Title,
                approval.Id
            );

            // Create notification for the applicant (simplified - use current user for demo)
            var currentUserId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (!string.IsNullOrEmpty(currentUserId))
            {
                await _notificationService.CreateNotificationAsync(
                    "error",
                    "Request Rejected",
                    $"Your {approval.Type} request '{approval.Title}' has been rejected",
                    currentUserId,
                    "high",
                    "approval",
                    approval.Id
                );
            }

            // Return the updated approval with related data (same structure as GetApprovals)
            var result = await _context.Approvals
                .Include(a => a.Applicant)
                .Include(a => a.Approver)
                .Include(a => a.Department)
                .Where(a => a.Id == approval.Id)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Type,
                    a.Priority,
                    a.Status,
                    a.RequestDate,
                    a.ResponseDate,
                    a.DueDate,
                    a.ApprovalNotes,
                    a.Amount,
                    a.CreatedAt,
                    a.UpdatedAt,
                    Applicant = new { a.Applicant.Id, a.Applicant.Name, a.Applicant.Email },
                    Approver = a.Approver != null ? new { a.Approver.Id, a.Approver.Name, a.Approver.Email } : null,
                    Department = a.Department != null ? new { a.Department.Id, a.Department.Name } : null
                })
                .FirstOrDefaultAsync();

            return Ok(result);
        }

        [HttpPost("bulk-action")]
        public async Task<IActionResult> BulkAction([FromBody] BulkApprovalRequest request)
        {
            var approvals = await _context.Approvals
                .Where(a => request.Ids.Contains(a.Id))
                .ToListAsync();

            if (approvals.Count == 0)
            {
                return NotFound("No approvals found for the provided IDs");
            }

            foreach (var approval in approvals)
            {
                approval.Status = request.Action;
                approval.ResponseDate = DateTime.UtcNow;
                approval.ApprovalNotes = request.Notes;
                approval.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Bulk action {request.Action} completed for {approvals.Count} approvals" });
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            var total = await _context.Approvals.CountAsync();
            var pending = await _context.Approvals.CountAsync(a => a.Status == "pending");
            var approved = await _context.Approvals.CountAsync(a => a.Status == "approved");
            var rejected = await _context.Approvals.CountAsync(a => a.Status == "rejected");

            var byType = await _context.Approvals
                .GroupBy(a => a.Type)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToListAsync();

            var byPriority = await _context.Approvals
                .GroupBy(a => a.Priority)
                .Select(g => new { Priority = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                total,
                pending,
                approved,
                rejected,
                byType,
                byPriority
            });
        }

        private bool ApprovalExists(string id)
        {
            return _context.Approvals.Any(e => e.Id == id);
        }

        private string GetPriorityFromApprovalPriority(string approvalPriority)
        {
            return approvalPriority.ToLower() switch
            {
                "urgent" => "high",
                "high" => "high",
                "medium" => "medium",
                "low" => "low",
                _ => "medium"
            };
        }
    }

    public class ApprovalDecision
    {
        public string? Notes { get; set; }
    }

    public class BulkApprovalRequest
    {
        public List<string> Ids { get; set; } = new();
        public string Action { get; set; } = string.Empty; // "approved", "rejected", "pending"
        public string? Notes { get; set; }
    }
}