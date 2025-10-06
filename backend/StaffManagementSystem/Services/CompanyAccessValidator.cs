using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace StaffManagementSystem.Services
{
    public interface ICompanyAccessValidator
    {
        bool IsValidCompanyEmail(string email);
        string ExtractDomainFromEmail(string email);
        bool IsAllowedDomain(string domain);
    }

    public class CompanyAccessValidator : ICompanyAccessValidator
    {
        private readonly CompanyAccessOptions _options;
        private readonly ILogger<CompanyAccessValidator> _logger;

        public CompanyAccessValidator(IOptions<CompanyAccessOptions> options, ILogger<CompanyAccessValidator> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public bool IsValidCompanyEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogWarning("Email validation failed: Email is null or empty");
                return false;
            }

            if (!IsValidEmailFormat(email))
            {
                _logger.LogWarning("Email validation failed: Invalid email format - {Email}", email);
                return false;
            }

            var domain = ExtractDomainFromEmail(email);
            var isAllowed = IsAllowedDomain(domain);

            if (!isAllowed)
            {
                _logger.LogWarning("Access denied: Email domain {Domain} is not in company whitelist", domain);
            }

            return isAllowed;
        }

        public string ExtractDomainFromEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return string.Empty;

            var atIndex = email.LastIndexOf('@');
            if (atIndex == -1 || atIndex == email.Length - 1)
                return string.Empty;

            return email.Substring(atIndex + 1).ToLowerInvariant();
        }

        public bool IsAllowedDomain(string domain)
        {
            if (string.IsNullOrWhiteSpace(domain))
                return false;

            var normalizedDomain = domain.ToLowerInvariant().Trim();

            // Check exact matches first
            if (_options.AllowedDomains.Contains(normalizedDomain, StringComparer.OrdinalIgnoreCase))
                return true;

            // Check wildcard patterns if enabled
            if (_options.AllowWildcards)
            {
                foreach (var allowedDomain in _options.AllowedDomains)
                {
                    if (allowedDomain.StartsWith("*."))
                    {
                        var baseDomain = allowedDomain.Substring(2);
                        if (normalizedDomain.EndsWith("." + baseDomain) || normalizedDomain.Equals(baseDomain))
                            return true;
                    }
                }
            }

            return false;
        }

        private bool IsValidEmailFormat(string email)
        {
            const string emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
            return Regex.IsMatch(email, emailPattern);
        }
    }

    public class CompanyAccessOptions
    {
        public const string SectionName = "CompanyAccess";

        public List<string> AllowedDomains { get; set; } = new List<string>();
        public bool AllowWildcards { get; set; } = false;
        public bool EnableAccessLogging { get; set; } = true;
        public string? CustomAccessDeniedMessage { get; set; }
    }
}