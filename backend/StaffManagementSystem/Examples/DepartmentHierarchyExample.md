# Department Hierarchy Implementation

## 🏢 How Department-SubDepartment Relationships Are Stored

### **Database Structure:**

The relationship is stored using a **self-referencing foreign key** pattern:

```sql
-- Department Table Structure
CREATE TABLE Departments (
    Id NVARCHAR(450) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    ParentDepartmentId NVARCHAR(450), -- Self-referencing FK
    Level INT NOT NULL DEFAULT 0,
    Path NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2,
    
    FOREIGN KEY (ParentDepartmentId) REFERENCES Departments(Id)
);
```

### **Example Hierarchy:**

```
Company
├── IT (Level 0, Path: "IT")
│   ├── Development (Level 1, Path: "IT/Development")
│   │   ├── Frontend (Level 2, Path: "IT/Development/Frontend")
│   │   ├── Backend (Level 2, Path: "IT/Development/Backend")
│   │   └── Mobile (Level 2, Path: "IT/Development/Mobile")
│   └── Infrastructure (Level 1, Path: "IT/Infrastructure")
│       ├── DevOps (Level 2, Path: "IT/Infrastructure/DevOps")
│       └── Security (Level 2, Path: "IT/Infrastructure/Security")
├── HR (Level 0, Path: "HR")
│   ├── Recruitment (Level 1, Path: "HR/Recruitment")
│   └── Training (Level 1, Path: "HR/Training")
└── Finance (Level 0, Path: "Finance")
    ├── Accounting (Level 1, Path: "Finance/Accounting")
    └── Budgeting (Level 1, Path: "Finance/Budgeting")
```

### **Sample Data:**

| Id | Name | ParentDepartmentId | Level | Path |
|----|------|-------------------|-------|------|
| 1 | IT | NULL | 0 | "IT" |
| 2 | Development | 1 | 1 | "IT/Development" |
| 3 | Frontend | 2 | 2 | "IT/Development/Frontend" |
| 4 | Backend | 2 | 2 | "IT/Development/Backend" |
| 5 | HR | NULL | 0 | "HR" |
| 6 | Recruitment | 5 | 1 | "HR/Recruitment" |

### **Navigation Properties:**

```csharp
public class Department
{
    // Self-referencing relationships
    public string? ParentDepartmentId { get; set; }
    public Department? ParentDepartment { get; set; }
    public ICollection<Department> SubDepartments { get; set; }
    
    // Helper properties for hierarchy
    public int Level { get; set; }
    public string? Path { get; set; }
}
```

## 🔧 Using the Hierarchy Service

### **Create Departments:**

```csharp
// Create root department
var itDept = await hierarchyService.CreateDepartmentAsync(new Department 
{ 
    Name = "IT",
    Description = "Information Technology" 
});

// Create sub-department
var devDept = await hierarchyService.CreateDepartmentAsync(new Department 
{ 
    Name = "Development",
    ParentDepartmentId = itDept.Id,
    Description = "Software Development Team"
});

// Create sub-sub-department
var frontendDept = await hierarchyService.CreateDepartmentAsync(new Department 
{ 
    Name = "Frontend",
    ParentDepartmentId = devDept.Id,
    Description = "Frontend Development Team"
});
```

### **Query Operations:**

```csharp
// Get complete department tree
var tree = await hierarchyService.GetDepartmentTreeAsync();

// Get all sub-departments of IT
var subDepts = await hierarchyService.GetSubDepartmentsAsync(itDept.Id);

// Get path from root to Frontend dept
var path = await hierarchyService.GetDepartmentPathAsync(frontendDept.Id);
// Returns: [IT, Development, Frontend]

// Move department to new parent
await hierarchyService.MoveDepartmentAsync(frontendDept.Id, hrDept.Id);
```

## 🛡️ Benefits of This Approach:

1. **Flexible Depth**: Unlimited hierarchy levels
2. **Path Navigation**: Easy breadcrumb generation
3. **Level Tracking**: Efficient queries by depth
4. **Circular Protection**: Prevents infinite loops
5. **Automatic Recalculation**: Updates paths when moving departments
6. **Employee Integration**: Each employee still belongs to exactly one department

## 📊 Database Queries:

### Find all employees in IT and its sub-departments:
```sql
SELECT e.* 
FROM Employees e
JOIN Departments d ON e.DepartmentId = d.Id
WHERE d.Path LIKE 'IT%'
```

### Count employees by department level:
```sql
SELECT d.Level, COUNT(e.Id) as EmployeeCount
FROM Departments d
LEFT JOIN Employees e ON d.Id = e.DepartmentId
GROUP BY d.Level
```

This implementation provides a robust, scalable solution for managing organizational hierarchies! 🎯