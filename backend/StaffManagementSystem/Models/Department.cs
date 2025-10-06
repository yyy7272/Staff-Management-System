using System.ComponentModel.DataAnnotations;

namespace StaffManagementSystem.Models
{
    public class Department
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Department name is required")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Description { get; set; }

        // Hierarchical relationship - Self-referencing Foreign Key
        public string? ParentDepartmentId { get; set; }

        // Navigation properties for hierarchy
        public Department? ParentDepartment { get; set; }
        public ICollection<Department> SubDepartments { get; set; } = new List<Department>();

        // Additional hierarchy properties
        public int Level { get; set; } = 0; // 0 = Root, 1 = First level, etc.
        public string? Path { get; set; } // e.g., "IT/Development/Frontend"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property (1:N) - References Users
        public ICollection<User> Users { get; set; } = new List<User>();

        public Department()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}
