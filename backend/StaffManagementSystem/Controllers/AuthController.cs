using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StaffManagementSystem.DataTransferObj;
using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly StaffDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(StaffDbContext context, IConfiguration config, IEmailService emailService, ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest("Username already exists.");

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            // Validate company email domain
            var companyValidator = HttpContext.RequestServices.GetRequiredService<ICompanyAccessValidator>();
            if (!companyValidator.IsValidCompanyEmail(dto.Email))
            {
                var domain = companyValidator.ExtractDomainFromEmail(dto.Email);
                return BadRequest($"Registration denied: Email domain '{domain}' is not authorized for this system. Please use your company email address.");
            }

            PasswordHasher.CreatePasswordHash(dto.Password, out byte[] hash, out byte[] salt);

            // Generate email verification token
            var verificationToken = Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
            var tokenExpiry = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PasswordHash = hash,
                PasswordSalt = salt,
                IsActive = false, // Account inactive until email verified
                EmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiry = tokenExpiry,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send verification email
            var emailSent = await _emailService.SendEmailVerificationAsync(user.Email, verificationToken, user.FirstName ?? user.Username);
            
            if (!emailSent)
            {
                _logger.LogWarning("Failed to send verification email to {Email}", user.Email);
            }

            return Ok(new { 
                message = "User registered successfully. Please check your email to verify your account.",
                userId = user.Id,
                email = user.Email,
                domain = companyValidator.ExtractDomainFromEmail(user.Email),
                emailSent = emailSent
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(UserLoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null) 
            {
                _logger.LogWarning("Login attempt for non-existent user: {Username}", dto.Username);
                return Unauthorized("Invalid username or password.");
            }

            // Check if account is locked
            if (user.IsAccountLocked && user.LockedUntil > DateTime.UtcNow)
            {
                _logger.LogWarning("Login attempt for locked account: {Username}", dto.Username);
                return Unauthorized("Account is temporarily locked. Please try again later.");
            }

            if (!PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
            {
                // Increment failed login attempts
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                {
                    user.IsAccountLocked = true;
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(30); // Lock for 30 minutes
                    _logger.LogWarning("Account locked due to failed login attempts: {Username}", dto.Username);
                }
                await _context.SaveChangesAsync();
                
                return Unauthorized("Invalid username or password.");
            }

            // Check email verification
            if (!user.EmailVerified)
            {
                _logger.LogWarning("Login attempt for unverified email: {Username}", dto.Username);
                return Unauthorized("Please verify your email address before logging in. Check your email for the verification link.");
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for inactive account: {Username}", dto.Username);
                return Unauthorized("Your account has been deactivated. Please contact an administrator.");
            }

            // Reset failed login attempts on successful login
            user.FailedLoginAttempts = 0;
            user.IsAccountLocked = false;
            user.LockedUntil = null;
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            string token = CreateJwtToken(user);
            
            return Ok(new {
                token = token,
                user = new {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    isAdministrator = user.IsAdministrator,
                    canManageUsers = user.CanManageUsers,
                    canManageRoles = user.CanManageRoles
                }
            });
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest("Verification token is required.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
            
            if (user == null)
            {
                _logger.LogWarning("Email verification attempted with invalid token: {Token}", token);
                return BadRequest("Invalid verification token.");
            }

            if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                _logger.LogWarning("Email verification attempted with expired token for user: {Username}", user.Username);
                return BadRequest("Verification token has expired. Please register again.");
            }

            if (user.EmailVerified)
            {
                return Ok("Email address is already verified. You can now log in.");
            }

            // Verify the email
            user.EmailVerified = true;
            user.IsActive = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send welcome email
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName ?? user.Username);

            _logger.LogInformation("Email verified successfully for user: {Username}", user.Username);

            // Redirect to frontend success page
            var baseUrl = _config["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
            return Redirect($"{baseUrl}/email-verified?success=true");
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest("Email is required.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            
            if (user == null)
            {
                // Don't reveal if email exists or not
                return Ok("If an account with this email exists and is unverified, a verification email has been sent.");
            }

            if (user.EmailVerified)
            {
                return BadRequest("This email address is already verified.");
            }

            // Generate new verification token
            user.EmailVerificationToken = Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

            await _context.SaveChangesAsync();

            // Send new verification email
            var emailSent = await _emailService.SendEmailVerificationAsync(user.Email, user.EmailVerificationToken, user.FirstName ?? user.Username);

            _logger.LogInformation("Verification email resent to: {Email}", user.Email);

            return Ok("If an account with this email exists and is unverified, a verification email has been sent.");
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // In JWT, logout is typically handled on the client side by removing the token
            // We can add token blacklisting here if needed in the future
            _logger.LogInformation("User logged out");
            return Ok(new { message = "Logged out successfully" });
        }

        // Utility methods
        

        private string CreateJwtToken(User user)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

            // Add roles from UserRoles relationship if needed
            // This would require loading the UserRoles relationship
            // For now, we'll add a default role
            claims.Add(new Claim(ClaimTypes.Role, "User"));

            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(6),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

}
