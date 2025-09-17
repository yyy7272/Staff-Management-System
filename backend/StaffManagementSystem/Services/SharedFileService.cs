using StaffManagementSystem.DbContexts;
using StaffManagementSystem.Models;
using StaffManagementSystem.DataTransferObj;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace StaffManagementSystem.Services
{
    public class SharedFileService : ISharedFileService
    {
        private readonly StaffDbContext _context;
        private readonly ILogger<SharedFileService> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly string _uploadPath;

        public SharedFileService(
            StaffDbContext context,
            ILogger<SharedFileService> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
            _uploadPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "shared-files");
            Directory.CreateDirectory(_uploadPath);
        }

        public async Task<SharedFileDto?> GetFileByIdAsync(string id, string currentUserId)
        {
            var file = await _context.SharedFiles
                .Include(f => f.Uploader)
                .Include(f => f.Group)
                .Include(f => f.Versions)
                .FirstOrDefaultAsync(f => f.Id == id && f.Status != "deleted");

            if (file == null || !await CanUserAccessFileAsync(id, currentUserId))
                return null;

            return await MapToSharedFileDtoAsync(file, currentUserId);
        }

        public async Task<List<SharedFileDto>> GetFilesAsync(string currentUserId, string? groupId = null, string? shareType = null)
        {
            var query = _context.SharedFiles
                .Include(f => f.Uploader)
                .Include(f => f.Group)
                .Include(f => f.Versions)
                .Where(f => f.Status != "deleted");

            // Filter by group
            if (!string.IsNullOrEmpty(groupId))
                query = query.Where(f => f.GroupId == groupId);

            // Filter by share type
            if (!string.IsNullOrEmpty(shareType))
                query = query.Where(f => f.ShareType == shareType);

            var files = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();

            // Filter files user can access
            var accessibleFiles = new List<SharedFile>();
            foreach (var file in files)
            {
                if (await CanUserAccessFileAsync(file.Id, currentUserId))
                    accessibleFiles.Add(file);
            }

            var result = new List<SharedFileDto>();
            foreach (var file in accessibleFiles)
            {
                result.Add(await MapToSharedFileDtoAsync(file, currentUserId));
            }

            return result;
        }

        public async Task<SharedFileDto> UploadFileAsync(UploadFileDto dto, string currentUserId)
        {
            if (dto.File.Length == 0)
                throw new ArgumentException("File is empty");

            // Generate unique file name
            var fileExtension = Path.GetExtension(dto.File.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(_uploadPath, uniqueFileName);

            // Calculate file hash
            var fileHash = await CalculateFileHashAsync(dto.File);

            // Check for duplicates
            var existingFile = await _context.SharedFiles
                .FirstOrDefaultAsync(f => f.FileHash == fileHash && f.Status != "deleted");

            if (existingFile != null)
            {
                // Return existing file reference instead of uploading duplicate
                return await GetFileByIdAsync(existingFile.Id, currentUserId)
                    ?? throw new InvalidOperationException("Failed to retrieve existing file");
            }

            // Save file to disk
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await dto.File.CopyToAsync(fileStream);
            }

            // Parse tags
            var tags = new List<string>();
            if (!string.IsNullOrEmpty(dto.Tags))
            {
                try
                {
                    tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.Tags) ?? new List<string>();
                }
                catch
                {
                    // If JSON parsing fails, treat as comma-separated string
                    tags = dto.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(t => t.Trim()).ToList();
                }
            }

            var sharedFile = new SharedFile
            {
                FileName = uniqueFileName,
                OriginalFileName = dto.File.FileName,
                ContentType = dto.File.ContentType,
                FileSize = dto.File.Length,
                FilePath = filePath,
                FileHash = fileHash,
                Description = dto.Description,
                Tags = System.Text.Json.JsonSerializer.Serialize(tags),
                UploaderId = currentUserId,
                GroupId = dto.GroupId,
                ShareType = dto.ShareType,
                CreatedAt = DateTime.UtcNow
            };

            _context.SharedFiles.Add(sharedFile);

            // Create initial version
            var version = new FileVersion
            {
                FileId = sharedFile.Id,
                VersionNumber = 1,
                FileName = uniqueFileName,
                ContentType = dto.File.ContentType,
                FileSize = dto.File.Length,
                FilePath = filePath,
                FileHash = fileHash,
                ChangeDescription = "Initial upload",
                UploadedById = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FileVersions.Add(version);
            await _context.SaveChangesAsync();

            return await GetFileByIdAsync(sharedFile.Id, currentUserId)
                ?? throw new InvalidOperationException("Failed to retrieve uploaded file");
        }

        public async Task<SharedFileDto?> UpdateFileAsync(string id, UpdateFileDto dto, string currentUserId)
        {
            var file = await _context.SharedFiles
                .FirstOrDefaultAsync(f => f.Id == id && f.Status != "deleted");

            if (file == null || !await CanUserEditFileAsync(id, currentUserId))
                return null;

            if (!string.IsNullOrEmpty(dto.Description))
                file.Description = dto.Description;

            if (!string.IsNullOrEmpty(dto.Tags))
                file.Tags = dto.Tags;

            if (!string.IsNullOrEmpty(dto.Status))
                file.Status = dto.Status;

            file.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetFileByIdAsync(id, currentUserId);
        }

        public async Task<bool> DeleteFileAsync(string id, string currentUserId)
        {
            var file = await _context.SharedFiles
                .FirstOrDefaultAsync(f => f.Id == id && f.Status != "deleted");

            if (file == null || !await CanUserDeleteFileAsync(id, currentUserId))
                return false;

            file.Status = "deleted";
            file.DeletedAt = DateTime.UtcNow;
            file.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(Stream fileStream, string fileName, string contentType)?> DownloadFileAsync(string id, string currentUserId)
        {
            var file = await _context.SharedFiles
                .FirstOrDefaultAsync(f => f.Id == id && f.Status != "deleted");

            if (file == null || !await CanUserAccessFileAsync(id, currentUserId))
                return null;

            if (!File.Exists(file.FilePath))
                return null;

            // Increment download count
            await IncrementDownloadCountAsync(id, currentUserId);

            var fileStream = new FileStream(file.FilePath, FileMode.Open, FileAccess.Read);
            return (fileStream, file.OriginalFileName, file.ContentType);
        }

        public async Task<bool> IncrementDownloadCountAsync(string id, string currentUserId)
        {
            var file = await _context.SharedFiles
                .FirstOrDefaultAsync(f => f.Id == id && f.Status != "deleted");

            if (file == null) return false;

            file.DownloadCount++;
            file.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<FileShareDto> ShareFileAsync(ShareFileDto dto, string currentUserId)
        {
            if (!await CanUserAccessFileAsync(dto.FileId, currentUserId))
                throw new UnauthorizedAccessException("Cannot share this file");

            var fileShare = new Models.FileShare
            {
                FileId = dto.FileId,
                SharedById = currentUserId,
                ShareType = dto.ShareType,
                Permission = dto.Permission,
                Message = dto.Message,
                ExpiresAt = dto.ExpiresAt,
                SharedAt = DateTime.UtcNow
            };

            // Set the appropriate target based on share type
            switch (dto.ShareType.ToLower())
            {
                case "employee":
                    fileShare.SharedWithId = dto.EmployeeId;
                    break;
                case "group":
                    fileShare.SharedWithGroupId = dto.GroupId;
                    break;
                case "department":
                    fileShare.SharedWithDepartmentId = dto.DepartmentId;
                    break;
            }

            _context.FileShares.Add(fileShare);
            await _context.SaveChangesAsync();

            return await MapToFileShareDtoAsync(fileShare);
        }

        public async Task<List<FileShareDto>> GetFileSharesAsync(string fileId, string currentUserId)
        {
            if (!await CanUserAccessFileAsync(fileId, currentUserId))
                return new List<FileShareDto>();

            var shares = await _context.FileShares
                .Include(fs => fs.SharedBy)
                .Include(fs => fs.SharedWith)
                .Include(fs => fs.SharedFile)
                .Where(fs => fs.FileId == fileId && fs.Status == "active")
                .ToListAsync();

            var result = new List<FileShareDto>();
            foreach (var share in shares)
            {
                result.Add(await MapToFileShareDtoAsync(share));
            }

            return result;
        }

        public async Task<List<FileShareDto>> GetSharedWithMeAsync(string currentUserId)
        {
            var shares = await _context.FileShares
                .Include(fs => fs.SharedBy)
                .Include(fs => fs.SharedFile)
                .Where(fs => fs.SharedWithId == currentUserId && fs.Status == "active")
                .OrderByDescending(fs => fs.SharedAt)
                .ToListAsync();

            var result = new List<FileShareDto>();
            foreach (var share in shares)
            {
                result.Add(await MapToFileShareDtoAsync(share));
            }

            return result;
        }

        public async Task<bool> RevokeShareAsync(string shareId, string currentUserId)
        {
            var share = await _context.FileShares
                .FirstOrDefaultAsync(fs => fs.Id == shareId && fs.SharedById == currentUserId);

            if (share == null) return false;

            share.Status = "revoked";
            await _context.SaveChangesAsync();

            return true;
        }

        // Simplified implementations for remaining methods
        public Task<SharedFileDto> UploadNewVersionAsync(string fileId, FileUploadVersionDto dto, string currentUserId)
        {
            throw new NotImplementedException("File versioning will be implemented later");
        }

        public Task<List<FileVersionDto>> GetFileVersionsAsync(string fileId, string currentUserId)
        {
            throw new NotImplementedException("File versioning will be implemented later");
        }

        public Task<(Stream fileStream, string fileName, string contentType)?> DownloadFileVersionAsync(string fileId, int versionNumber, string currentUserId)
        {
            throw new NotImplementedException("File versioning will be implemented later");
        }

        public Task<List<SharedFileDto>> SearchFilesAsync(string query, string currentUserId, string? groupId = null)
        {
            throw new NotImplementedException("File search will be implemented later");
        }

        public Task<List<SharedFileDto>> GetFilesByTagsAsync(List<string> tags, string currentUserId, string? groupId = null)
        {
            throw new NotImplementedException("Tag-based filtering will be implemented later");
        }

        public async Task<List<SharedFileDto>> GetRecentFilesAsync(string currentUserId, int count = 10)
        {
            return await GetFilesAsync(currentUserId);
        }

        public async Task<bool> CanUserAccessFileAsync(string fileId, string currentUserId)
        {
            var file = await _context.SharedFiles
                .Include(f => f.Group)
                    .ThenInclude(g => g.Members)
                .FirstOrDefaultAsync(f => f.Id == fileId);

            if (file == null) return false;

            // File uploader can always access
            if (file.UploaderId == currentUserId) return true;

            // Check based on share type
            switch (file.ShareType.ToLower())
            {
                case "company":
                    return true; // All employees can access

                case "group":
                    if (file.Group?.Members.Any(m => m.EmployeeId == currentUserId && m.Status == "active") == true)
                        return true;
                    break;

                case "department":
                    var user = await _context.Employees.FirstOrDefaultAsync(e => e.Id == currentUserId);
                    // For department sharing, we'd need to implement department-based access
                    break;
            }

            // Check if explicitly shared with user
            var hasDirectShare = await _context.FileShares
                .AnyAsync(fs => fs.FileId == fileId && fs.SharedWithId == currentUserId && fs.Status == "active");

            return hasDirectShare;
        }

        public async Task<bool> CanUserEditFileAsync(string fileId, string currentUserId)
        {
            var file = await _context.SharedFiles.FirstOrDefaultAsync(f => f.Id == fileId);
            return file?.UploaderId == currentUserId;
        }

        public async Task<bool> CanUserDeleteFileAsync(string fileId, string currentUserId)
        {
            var file = await _context.SharedFiles.FirstOrDefaultAsync(f => f.Id == fileId);
            return file?.UploaderId == currentUserId;
        }

        public Task<long> GetUserStorageUsageAsync(string currentUserId)
        {
            return _context.SharedFiles
                .Where(f => f.UploaderId == currentUserId && f.Status != "deleted")
                .SumAsync(f => f.FileSize);
        }

        public Task<long> GetGroupStorageUsageAsync(string groupId, string currentUserId)
        {
            return _context.SharedFiles
                .Where(f => f.GroupId == groupId && f.Status != "deleted")
                .SumAsync(f => f.FileSize);
        }

        public Task<bool> CleanupDeletedFilesAsync()
        {
            throw new NotImplementedException("File cleanup will be implemented later");
        }

        public Task<object> GetFileStatisticsAsync(string fileId, string currentUserId)
        {
            throw new NotImplementedException("File statistics will be implemented later");
        }

        public Task<object> GetUserFileStatisticsAsync(string currentUserId)
        {
            throw new NotImplementedException("User file statistics will be implemented later");
        }

        private async Task<string> CalculateFileHashAsync(IFormFile file)
        {
            using var sha256 = SHA256.Create();
            using var stream = file.OpenReadStream();
            var hash = await Task.Run(() => sha256.ComputeHash(stream));
            return Convert.ToHexString(hash);
        }

        private async Task<SharedFileDto> MapToSharedFileDtoAsync(SharedFile file, string currentUserId)
        {
            var tags = new List<string>();
            if (!string.IsNullOrEmpty(file.Tags))
            {
                try
                {
                    tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(file.Tags) ?? new List<string>();
                }
                catch { }
            }

            return new SharedFileDto
            {
                Id = file.Id,
                FileName = file.FileName,
                OriginalFileName = file.OriginalFileName,
                ContentType = file.ContentType,
                FileSize = file.FileSize,
                FileSizeFormatted = FormatFileSize(file.FileSize),
                Description = file.Description,
                Tags = tags,
                UploaderId = file.UploaderId,
                UploaderName = file.Uploader?.Name ?? "Unknown",
                GroupId = file.GroupId,
                GroupName = file.Group?.Name,
                ShareType = file.ShareType,
                Status = file.Status,
                DownloadCount = file.DownloadCount,
                CreatedAt = file.CreatedAt,
                UpdatedAt = file.UpdatedAt,
                Versions = file.Versions?.Select(v => new FileVersionDto
                {
                    Id = v.Id,
                    VersionNumber = v.VersionNumber,
                    FileName = v.FileName,
                    FileSize = v.FileSize,
                    FileSizeFormatted = FormatFileSize(v.FileSize),
                    ChangeDescription = v.ChangeDescription,
                    UploadedById = v.UploadedById,
                    UploadedByName = v.UploadedBy?.Name ?? "Unknown",
                    CreatedAt = v.CreatedAt
                }).ToList() ?? new List<FileVersionDto>(),
                CanEdit = await CanUserEditFileAsync(file.Id, currentUserId),
                CanDelete = await CanUserDeleteFileAsync(file.Id, currentUserId),
                CanDownload = await CanUserAccessFileAsync(file.Id, currentUserId)
            };
        }

        private async Task<FileShareDto> MapToFileShareDtoAsync(Models.FileShare share)
        {
            return new FileShareDto
            {
                Id = share.Id,
                FileId = share.FileId,
                FileName = share.SharedFile?.OriginalFileName ?? "Unknown",
                SharedById = share.SharedById,
                SharedByName = share.SharedBy?.Name ?? "Unknown",
                SharedWithId = share.SharedWithId,
                SharedWithName = share.SharedWith?.Name,
                ShareType = share.ShareType,
                Permission = share.Permission,
                Message = share.Message,
                ExpiresAt = share.ExpiresAt,
                SharedAt = share.SharedAt,
                AccessedAt = share.AccessedAt,
                Status = share.Status
            };
        }

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double size = bytes;

            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size /= 1024;
            }

            return $"{size:0.##} {sizes[order]}";
        }
    }
}