using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;

namespace StaffManagementSystem.Services
{
    public interface IAdminInitializationService
    {
        Task InitializeDefaultAdminAsync();
    }

    public class AdminInitializationService : IAdminInitializationService
    {
        private readonly StaffDbContext _context;
        private readonly ILogger<AdminInitializationService> _logger;
        private readonly IConfiguration _configuration;

        public AdminInitializationService(StaffDbContext context, ILogger<AdminInitializationService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task InitializeDefaultAdminAsync()
        {
            try
            {
                // Check if any admin users already exist
                var existingAdmin = await _context.Users
                    .FirstOrDefaultAsync(u => u.IsAdministrator);

                if (existingAdmin != null)
                {
                    _logger.LogInformation("Administrator account already exists. Skipping initialization.");
                    return;
                }

                // Get default admin settings from configuration
                var adminSettings = _configuration.GetSection("DefaultAdmin");
                var adminUsername = adminSettings["Username"] ?? "admin";
                var adminEmail = adminSettings["Email"] ?? "admin@company.com";
                var adminPassword = adminSettings["Password"] ?? "Admin123!@#";
                var adminFirstName = adminSettings["FirstName"] ?? "System";
                var adminLastName = adminSettings["LastName"] ?? "Administrator";

                // Validate that the admin email domain is allowed
                var companyValidator = GetCompanyValidator();
                if (companyValidator != null && !companyValidator.IsValidCompanyEmail(adminEmail))
                {
                    _logger.LogWarning("Default admin email {AdminEmail} is not in allowed company domains. Using fallback domain.", adminEmail);
                    // Use the first allowed domain for the admin
                    var allowedDomains = _configuration.GetSection("CompanyAccess:AllowedDomains").Get<List<string>>();
                    if (allowedDomains?.Any() == true)
                    {
                        adminEmail = $"admin@{allowedDomains.First()}";
                    }
                }

                // Check if username or email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == adminUsername || u.Email == adminEmail);

                if (existingUser != null)
                {
                    _logger.LogWarning("User with admin username or email already exists. Skipping admin initialization.");
                    return;
                }

                // Create password hash
                PasswordHasher.CreatePasswordHash(adminPassword, out byte[] passwordHash, out byte[] passwordSalt);

                // Create default administrator account
                var adminUser = new User
                {
                    Username = adminUsername,
                    Email = adminEmail,
                    FirstName = adminFirstName,
                    LastName = adminLastName,
                    PasswordHash = passwordHash,
                    PasswordSalt = passwordSalt,
                    IsActive = true,
                    EmailVerified = true, // Admin account is pre-verified
                    IsAdministrator = true,
                    CanManageUsers = true,
                    CanManageRoles = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Default administrator account created successfully with username: {Username}", adminUsername);
                _logger.LogWarning("IMPORTANT: Default admin password is '{Password}'. Please change it immediately after first login!", adminPassword);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize default administrator account");
                throw;
            }
        }

        private ICompanyAccessValidator? GetCompanyValidator()
        {
            // For simplicity, create a temporary validator using configuration
            try
            {
                var companyOptions = _configuration.GetSection("CompanyAccess").Get<CompanyAccessOptions>();
                if (companyOptions != null)
                {
                    var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
                    var logger = loggerFactory.CreateLogger<CompanyAccessValidator>();
                    var options = Microsoft.Extensions.Options.Options.Create(companyOptions);
                    return new CompanyAccessValidator(options, logger);
                }
                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}