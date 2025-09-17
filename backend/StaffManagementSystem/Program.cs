using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DataTransferObj;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Services;
using StaffManagementSystem.Middleware;
using StaffManagementSystem.Models;



namespace StaffManagementSystem
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add CORS policy
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8000", "http://localhost:5173") // Support multiple frontend ports
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials()
                          .SetIsOriginAllowed(_ => true); // Allow all origins for SignalR during development
                });
            });

            builder.Services.AddControllers();
            builder.Services.AddOpenApi(); // OpenAPI/Swagger
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddMemoryCache(); // Add Memory Cache for collaboration service
            builder.Services.AddDbContext<StaffDbContext>(options =>
              options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
                ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

            // Configure Company Access options
            builder.Services.Configure<CompanyAccessOptions>(
                builder.Configuration.GetSection(CompanyAccessOptions.SectionName));

            // Register Company Access Validator
            builder.Services.AddScoped<ICompanyAccessValidator, CompanyAccessValidator>();

            // Register Department Hierarchy Service
            builder.Services.AddScoped<IDepartmentHierarchyService, DepartmentHierarchyService>();

            // Configure Email settings
            builder.Services.Configure<EmailSettings>(
                builder.Configuration.GetSection(EmailSettings.SectionName));

            // Register Email Service
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Register Admin Initialization Service
            builder.Services.AddScoped<IAdminInitializationService, AdminInitializationService>();

            // Register Image Processing Service
            builder.Services.AddScoped<IImageProcessingService, ImageProcessingService>();

            // Register Activity Service
            builder.Services.AddScoped<IActivityService, ActivityService>();

            // Register Notification Service
            builder.Services.AddScoped<INotificationService, NotificationService>();

            // Register Collaboration Service
            builder.Services.AddScoped<ICollaborationService, CollaborationService>();

            // Register Group Service
            builder.Services.AddScoped<IGroupService, GroupService>();

            // Register Shared File Service
            builder.Services.AddScoped<ISharedFileService, SharedFileService>();

            // Add SignalR
            builder.Services.AddSignalR();
            
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
              .AddJwtBearer(options =>
              {
                  options.TokenValidationParameters = new TokenValidationParameters
                  {
                      ValidateIssuerSigningKey = true,
                      IssuerSigningKey = new SymmetricSecurityKey(
                          Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
                      ValidateIssuer = true,
                      ValidateAudience = true,
                      ValidIssuer = builder.Configuration["Jwt:Issuer"],
                      ValidAudience = builder.Configuration["Jwt:Audience"],
                      ValidateLifetime = true,
                      ClockSkew = TimeSpan.Zero // Reduce token lifetime tolerance
                  };

                  // Configure SignalR JWT authentication
                  options.Events = new JwtBearerEvents
                  {
                      OnMessageReceived = context =>
                      {
                          var accessToken = context.Request.Query["access_token"];
                          var path = context.HttpContext.Request.Path;
                          if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/collaborationHub"))
                          {
                              context.Token = accessToken;
                          }
                          return Task.CompletedTask;
                      }
                  };
              });

            builder.Services.AddAuthorization();

            



            var app = builder.Build();

            // Ensure database is created and initialize default administrator account
            using (var scope = app.Services.CreateScope())
            {
                var staffContext = scope.ServiceProvider.GetRequiredService<StaffDbContext>();
                
                // Ensure database exists
                await staffContext.Database.EnsureCreatedAsync();
                
                var adminService = scope.ServiceProvider.GetRequiredService<IAdminInitializationService>();
                await adminService.InitializeDefaultAdminAsync();
                
                // Seed sample data if not exists
                if (!staffContext.Departments.Any())
                {
                    var departments = new[]
                    {
                        new Department { Id = Guid.NewGuid().ToString(), Name = "Technology", Description = "IT Department" },
                        new Department { Id = Guid.NewGuid().ToString(), Name = "Marketing", Description = "Marketing Department" },
                        new Department { Id = Guid.NewGuid().ToString(), Name = "Human Resources", Description = "HR Department" }
                    };
                    
                    foreach (var dept in departments)
                    {
                        staffContext.Departments.Add(dept);
                    }
                    await staffContext.SaveChangesAsync();
                    
                    // Add sample employees
                    var employees = new[]
                    {
                        new Employee 
                        { 
                            Id = Guid.NewGuid().ToString(), 
                            Name = "John Doe", 
                            Email = "john@company.com", 
                            Position = "Software Developer", 
                            DepartmentId = departments[0].Id, 
                            Salary = 75000, 
                            Status = "active", 
                            HireDate = DateTime.Now.AddYears(-1) 
                        },
                        new Employee 
                        { 
                            Id = Guid.NewGuid().ToString(), 
                            Name = "Jane Smith", 
                            Email = "jane@company.com", 
                            Position = "Marketing Manager", 
                            DepartmentId = departments[1].Id, 
                            Salary = 65000, 
                            Status = "active", 
                            HireDate = DateTime.Now.AddMonths(-6) 
                        }
                    };
                    
                    foreach (var emp in employees)
                    {
                        staffContext.Employees.Add(emp);
                    }
                    await staffContext.SaveChangesAsync();
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();

            // Enable static file serving for uploaded images
            app.UseStaticFiles();

            // Use CORS (must be before MapControllers)
            app.UseCors("AllowFrontend");

            // Authentication must come before Authorization
            app.UseAuthentication();
            app.UseAuthorization();

            // Add Company Access Validation middleware after authentication
            app.UseCompanyAccessValidation();

            app.MapControllers();

            // Map SignalR Hub
            app.MapHub<StaffManagementSystem.Hubs.CollaborationHub>("/collaborationHub");

            app.Run();
        }
    }
}

