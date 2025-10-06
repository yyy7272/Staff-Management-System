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
        public DbSet<Department> Departments { get; set; }
        public DbSet<Approval> Approvals { get; set; }
        public DbSet<Activity> Activities { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Payroll> Payrolls { get; set; }

        // Group and File Sharing entities
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<SharedFile> SharedFiles { get; set; }
        public DbSet<Models.FileShare> FileShares { get; set; }
        public DbSet<FileVersion> FileVersions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Department hierarchy - Self-referencing relationship
            modelBuilder.Entity<Department>()
                .HasOne(d => d.ParentDepartment)
                .WithMany(d => d.SubDepartments)
                .HasForeignKey(d => d.ParentDepartmentId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes

            // User-Department relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Approval relationships
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

            // Payroll-User relationship
            modelBuilder.Entity<Payroll>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payroll>()
                .Property(p => p.UpdatedAt)
                .ValueGeneratedOnUpdate();

            // Notification-User relationship
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification indexes for performance
            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.UserId);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead, n.IsDeleted });

            // Group relationships
            modelBuilder.Entity<Group>()
                .HasOne(g => g.Creator)
                .WithMany()
                .HasForeignKey(g => g.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);

            // GroupMember relationships
            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany()
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint for GroupMember (one user per group)
            modelBuilder.Entity<GroupMember>()
                .HasIndex(gm => new { gm.GroupId, gm.UserId })
                .IsUnique();

            // SharedFile relationships
            modelBuilder.Entity<SharedFile>()
                .HasOne(sf => sf.Uploader)
                .WithMany()
                .HasForeignKey(sf => sf.UploaderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SharedFile>()
                .HasOne(sf => sf.Group)
                .WithMany(g => g.SharedFiles)
                .HasForeignKey(sf => sf.GroupId)
                .OnDelete(DeleteBehavior.SetNull);

            // FileShare relationships
            modelBuilder.Entity<Models.FileShare>()
                .HasOne(fs => fs.SharedFile)
                .WithMany(sf => sf.FileShares)
                .HasForeignKey(fs => fs.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Models.FileShare>()
                .HasOne(fs => fs.SharedBy)
                .WithMany()
                .HasForeignKey(fs => fs.SharedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.FileShare>()
                .HasOne(fs => fs.SharedWith)
                .WithMany()
                .HasForeignKey(fs => fs.SharedWithId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.FileShare>()
                .HasOne(fs => fs.SharedWithGroup)
                .WithMany()
                .HasForeignKey(fs => fs.SharedWithGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.FileShare>()
                .HasOne(fs => fs.SharedWithDepartment)
                .WithMany()
                .HasForeignKey(fs => fs.SharedWithDepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // FileVersion relationships
            modelBuilder.Entity<FileVersion>()
                .HasOne(fv => fv.SharedFile)
                .WithMany(sf => sf.Versions)
                .HasForeignKey(fv => fv.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FileVersion>()
                .HasOne(fv => fv.UploadedBy)
                .WithMany()
                .HasForeignKey(fv => fv.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            modelBuilder.Entity<Group>()
                .HasIndex(g => g.Type);

            modelBuilder.Entity<Group>()
                .HasIndex(g => g.Status);

            modelBuilder.Entity<GroupMember>()
                .HasIndex(gm => gm.UserId);

            modelBuilder.Entity<SharedFile>()
                .HasIndex(sf => sf.UploaderId);

            modelBuilder.Entity<SharedFile>()
                .HasIndex(sf => sf.GroupId);

            modelBuilder.Entity<SharedFile>()
                .HasIndex(sf => sf.Status);

            modelBuilder.Entity<SharedFile>()
                .HasIndex(sf => sf.CreatedAt);

            modelBuilder.Entity<Models.FileShare>()
                .HasIndex(fs => fs.SharedById);

            modelBuilder.Entity<Models.FileShare>()
                .HasIndex(fs => fs.SharedWithId);

            // Configure automatic update of UpdatedAt fields for new entities
            modelBuilder.Entity<Group>()
                .Property(g => g.UpdatedAt)
                .ValueGeneratedOnUpdate();

            modelBuilder.Entity<GroupMember>()
                .Property(gm => gm.UpdatedAt)
                .ValueGeneratedOnUpdate();

            modelBuilder.Entity<SharedFile>()
                .Property(sf => sf.UpdatedAt)
                .ValueGeneratedOnUpdate();

            base.OnModelCreating(modelBuilder);
        }
    }
}

