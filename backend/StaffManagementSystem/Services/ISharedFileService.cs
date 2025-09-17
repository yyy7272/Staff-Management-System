using StaffManagementSystem.DataTransferObj;

namespace StaffManagementSystem.Services
{
    public interface ISharedFileService
    {
        // File CRUD operations
        Task<SharedFileDto?> GetFileByIdAsync(string id, string currentUserId);
        Task<List<SharedFileDto>> GetFilesAsync(string currentUserId, string? groupId = null, string? shareType = null);
        Task<SharedFileDto> UploadFileAsync(UploadFileDto dto, string currentUserId);
        Task<SharedFileDto?> UpdateFileAsync(string id, UpdateFileDto dto, string currentUserId);
        Task<bool> DeleteFileAsync(string id, string currentUserId);

        // File download and access
        Task<(Stream fileStream, string fileName, string contentType)?> DownloadFileAsync(string id, string currentUserId);
        Task<bool> IncrementDownloadCountAsync(string id, string currentUserId);

        // File sharing
        Task<FileShareDto> ShareFileAsync(ShareFileDto dto, string currentUserId);
        Task<List<FileShareDto>> GetFileSharesAsync(string fileId, string currentUserId);
        Task<List<FileShareDto>> GetSharedWithMeAsync(string currentUserId);
        Task<bool> RevokeShareAsync(string shareId, string currentUserId);

        // File versions
        Task<SharedFileDto> UploadNewVersionAsync(string fileId, FileUploadVersionDto dto, string currentUserId);
        Task<List<FileVersionDto>> GetFileVersionsAsync(string fileId, string currentUserId);
        Task<(Stream fileStream, string fileName, string contentType)?> DownloadFileVersionAsync(string fileId, int versionNumber, string currentUserId);

        // File search and filtering
        Task<List<SharedFileDto>> SearchFilesAsync(string query, string currentUserId, string? groupId = null);
        Task<List<SharedFileDto>> GetFilesByTagsAsync(List<string> tags, string currentUserId, string? groupId = null);
        Task<List<SharedFileDto>> GetRecentFilesAsync(string currentUserId, int count = 10);

        // File permissions and validation
        Task<bool> CanUserAccessFileAsync(string fileId, string currentUserId);
        Task<bool> CanUserEditFileAsync(string fileId, string currentUserId);
        Task<bool> CanUserDeleteFileAsync(string fileId, string currentUserId);

        // Storage management
        Task<long> GetUserStorageUsageAsync(string currentUserId);
        Task<long> GetGroupStorageUsageAsync(string groupId, string currentUserId);
        Task<bool> CleanupDeletedFilesAsync();

        // File statistics
        Task<object> GetFileStatisticsAsync(string fileId, string currentUserId);
        Task<object> GetUserFileStatisticsAsync(string currentUserId);
    }
}