using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Net;
using System.Text;

namespace StaffManagementSystem.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailVerificationAsync(string email, string verificationToken, string userName);
        Task<bool> SendWelcomeEmailAsync(string email, string userName);
        Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string userName);
    }

    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger, IConfiguration configuration)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<bool> SendEmailVerificationAsync(string email, string verificationToken, string userName)
        {
            try
            {
                var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://localhost:5000";
                var verificationLink = $"{baseUrl}/api/auth/verify-email?token={verificationToken}";

                var subject = "Verify Your Email Address - Staff Management System";
                var body = CreateVerificationEmailBody(userName, verificationLink);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}", email);
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string userName)
        {
            try
            {
                var subject = "Welcome to Staff Management System";
                var body = CreateWelcomeEmailBody(userName);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
                return false;
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string userName)
        {
            try
            {
                var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
                var resetLink = $"{frontendUrl}/reset-password?token={resetToken}&email={Uri.EscapeDataString(email)}";

                var subject = "Password Reset Request - Staff Management System";
                var body = CreatePasswordResetEmailBody(userName, resetLink);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
                return false;
            }
        }

        private async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                using var client = new SmtpClient(_emailSettings.SmtpHost, _emailSettings.SmtpPort);
                client.EnableSsl = _emailSettings.EnableSsl;
                client.Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                return false;
            }
        }

        private string CreateVerificationEmailBody(string userName, string verificationLink)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Email Verification</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; color: #333; margin-bottom: 30px; }}
        .content {{ color: #666; line-height: 1.6; }}
        .verify-button {{ display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to Staff Management System!</h1>
        </div>
        <div class='content'>
            <p>Hello {userName},</p>
            <p>Thank you for registering with our Staff Management System. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            <div style='text-align: center;'>
                <a href='{verificationLink}' class='verify-button'>Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style='word-break: break-all; color: #007bff;'>{verificationLink}</p>
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class='footer'>
            <p>This is an automated message from Staff Management System. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreateWelcomeEmailBody(string userName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Welcome</title>
</head>
<body style='font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;'>
    <div style='max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px;'>
        <h1 style='color: #28a745; text-align: center;'>Welcome to Staff Management System!</h1>
        <p>Hello {userName},</p>
        <p>Your email has been successfully verified and your account is now active!</p>
        <p>You can now log in and start using the Staff Management System.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you for joining us!</p>
    </div>
</body>
</html>";
        }

        private string CreatePasswordResetEmailBody(string userName, string resetLink)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Password Reset</title>
</head>
<body style='font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;'>
    <div style='max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px;'>
        <h1 style='color: #dc3545; text-align: center;'>Password Reset Request</h1>
        <p>Hello {userName},</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <div style='text-align: center; margin: 20px 0;'>
            <a href='{resetLink}' style='background-color: #dc3545; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px;'>Reset Password</a>
        </div>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
    </div>
</body>
</html>";
        }
    }

    public class EmailSettings
    {
        public const string SectionName = "EmailSettings";

        public string SmtpHost { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public bool EnableSsl { get; set; } = true;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }
}