using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.DbContexts
{
    public class StaffDbContext : DbContext
    {
        public StaffDbContext(DbContextOptions<StaffDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Approval> Approvals { get; set; }
        public DbSet<Activity> Activities { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Payroll> Payrolls { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Department hierarchy - Self-referencing relationship
            modelBuilder.Entity<Department>()
                .HasOne(d => d.ParentDepartment)
                .WithMany(d => d.SubDepartments)
                .HasForeignKey(d => d.ParentDepartmentId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes

            // Employee-Department relationship
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Approval relationships (back to using Employee)
            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Applicant)
                .WithMany(e => e.ApplicantApprovals)
                .HasForeignKey(a => a.ApplicantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Approver)
                .WithMany(e => e.ApproverApprovals)
                .HasForeignKey(a => a.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Department)
                .WithMany()
                .HasForeignKey(a => a.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure automatic update of UpdatedAt fields
            modelBuilder.Entity<User>()
                .Property(u => u.UpdatedAt)
                .ValueGeneratedOnUpdate();

            modelBuilder.Entity<Employee>()
                .Property(e => e.UpdatedAt)
                .ValueGeneratedOnUpdate();

            modelBuilder.Entity<Department>()
                .Property(d => d.UpdatedAt)
                .ValueGeneratedOnUpdate();

            modelBuilder.Entity<Approval>()
                .Property(a => a.UpdatedAt)
                .ValueGeneratedOnUpdate();

            // User authentication constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Payroll-Employee relationship (back to Employee)
            modelBuilder.Entity<Payroll>()
                .HasOne(p => p.Employee)
                .WithMany()
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payroll>()
                .Property(p => p.UpdatedAt)
                .ValueGeneratedOnUpdate();

            base.OnModelCreating(modelBuilder);
        }
    }
}

