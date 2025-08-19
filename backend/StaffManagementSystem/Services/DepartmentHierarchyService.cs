using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.Services
{
    public interface IDepartmentHierarchyService
    {
        Task<Department> CreateDepartmentAsync(Department department);
        Task<List<Department>> GetDepartmentTreeAsync();
        Task<List<Department>> GetSubDepartmentsAsync(string parentId);
        Task<List<Department>> GetDepartmentPathAsync(string departmentId);
        Task<bool> MoveDepartmentAsync(string departmentId, string? newParentId);
        Task<int> GetDepartmentLevelAsync(string departmentId);
    }

    public class DepartmentHierarchyService : IDepartmentHierarchyService
    {
        private readonly StaffDbContext _context;

        public DepartmentHierarchyService(StaffDbContext context)
        {
            _context = context;
        }

        public async Task<Department> CreateDepartmentAsync(Department department)
        {
            // Calculate level and path
            if (!string.IsNullOrEmpty(department.ParentDepartmentId))
            {
                var parent = await _context.Departments
                    .FindAsync(department.ParentDepartmentId);

                if (parent != null)
                {
                    department.Level = parent.Level + 1;
                    department.Path = string.IsNullOrEmpty(parent.Path) 
                        ? parent.Name + "/" + department.Name
                        : parent.Path + "/" + department.Name;
                }
            }
            else
            {
                department.Level = 0;
                department.Path = department.Name;
            }

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<List<Department>> GetDepartmentTreeAsync()
        {
            return await _context.Departments
                .Include(d => d.SubDepartments)
                .Include(d => d.ParentDepartment)
                .OrderBy(d => d.Path)
                .ToListAsync();
        }

        public async Task<List<Department>> GetSubDepartmentsAsync(string parentId)
        {
            return await _context.Departments
                .Where(d => d.ParentDepartmentId == parentId)
                .Include(d => d.SubDepartments)
                .ToListAsync();
        }

        public async Task<List<Department>> GetDepartmentPathAsync(string departmentId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null) return new List<Department>();

            var path = new List<Department>();
            var current = department;

            while (current != null)
            {
                path.Insert(0, current);
                if (current.ParentDepartmentId != null)
                {
                    current = await _context.Departments.FindAsync(current.ParentDepartmentId);
                }
                else
                {
                    current = null;
                }
            }

            return path;
        }

        public async Task<bool> MoveDepartmentAsync(string departmentId, string? newParentId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null) return false;

            // Prevent circular references
            if (newParentId != null && await IsCircularReference(departmentId, newParentId))
                return false;

            department.ParentDepartmentId = newParentId;
            await RecalculateHierarchyAsync(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetDepartmentLevelAsync(string departmentId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            return department?.Level ?? -1;
        }

        private async Task<bool> IsCircularReference(string departmentId, string newParentId)
        {
            var current = newParentId;
            while (current != null)
            {
                if (current == departmentId) return true;
                var parent = await _context.Departments.FindAsync(current);
                current = parent?.ParentDepartmentId;
            }
            return false;
        }

        private async Task RecalculateHierarchyAsync(Department department)
        {
            // Recalculate level and path
            if (!string.IsNullOrEmpty(department.ParentDepartmentId))
            {
                var parent = await _context.Departments.FindAsync(department.ParentDepartmentId);
                if (parent != null)
                {
                    department.Level = parent.Level + 1;
                    department.Path = string.IsNullOrEmpty(parent.Path)
                        ? parent.Name + "/" + department.Name
                        : parent.Path + "/" + department.Name;
                }
            }
            else
            {
                department.Level = 0;
                department.Path = department.Name;
            }

            // Recursively update all child departments
            var children = await _context.Departments
                .Where(d => d.ParentDepartmentId == department.Id)
                .ToListAsync();

            foreach (var child in children)
            {
                await RecalculateHierarchyAsync(child);
            }
        }
    }
}