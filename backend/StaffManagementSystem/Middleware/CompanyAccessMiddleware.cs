using Microsoft.EntityFrameworkCore;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Services;
using System.Security.Claims;

namespace StaffManagementSystem.Middleware
{
    public class CompanyAccessMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CompanyAccessMiddleware> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public CompanyAccessMiddleware(
            RequestDelegate next, 
            ILogger<CompanyAccessMiddleware> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _next = next;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip validation for certain endpoints
            if (ShouldSkipValidation(context))
            {
                await _next(context);
                return;
            }

            // Check if user is authenticated
            if (!context.User.Identity?.IsAuthenticated == true)
            {
                await _next(context);
                return;
            }

            var username = context.User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Company access validation failed: No username in claims");
                await WriteUnauthorizedResponse(context, "Access denied: Invalid authentication");
                return;
            }

            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<StaffDbContext>();
            var companyValidator = scope.ServiceProvider.GetRequiredService<ICompanyAccessValidator>();

            try
            {
                var user = await dbContext.Users
                    .FirstOrDefaultAsync(u => u.Username == username);

                if (user == null)
                {
                    _logger.LogWarning("Company access validation failed: User {Username} not found", username);
                    await WriteUnauthorizedResponse(context, "Access denied: User not found");
                    return;
                }

                if (string.IsNullOrEmpty(user.Email))
                {
                    _logger.LogWarning("Company access validation failed: User {Username} has no email", username);
                    await WriteUnauthorizedResponse(context, "Access denied: User email required");
                    return;
                }

                if (!companyValidator.IsValidCompanyEmail(user.Email))
                {
                    _logger.LogWarning("Company access denied: User {Username} with email {Email} not from authorized domain", 
                        username, user.Email);
                    await WriteUnauthorizedResponse(context, "Access denied: Not authorized for this system");
                    return;
                }

                // User is from authorized company domain
                _logger.LogInformation("Company access granted: User {Username} from domain {Domain}", 
                    username, companyValidator.ExtractDomainFromEmail(user.Email));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during company access validation for user {Username}", username);
                await WriteUnauthorizedResponse(context, "Access denied: Validation error");
                return;
            }

            await _next(context);
        }

        private bool ShouldSkipValidation(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant();
            
            // Skip validation for these paths
            var skipPaths = new[]
            {
                "/api/auth/login",
                "/api/auth/register",
                "/health",
                "/swagger",
                "/favicon.ico"
            };

            return skipPaths.Any(skipPath => path?.StartsWith(skipPath) == true);
        }

        private async Task WriteUnauthorizedResponse(HttpContext context, string message)
        {
            context.Response.StatusCode = 403; // Forbidden
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = "Access Denied",
                message = message,
                timestamp = DateTime.UtcNow
            };

            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    }

    public static class CompanyAccessMiddlewareExtensions
    {
        public static IApplicationBuilder UseCompanyAccessValidation(this IApplicationBuilder app)
        {
            return app.UseMiddleware<CompanyAccessMiddleware>();
        }
    }
}