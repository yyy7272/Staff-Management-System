using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StaffManagementSystem.Services;
using StaffManagementSystem.DataTransferObj;
using System.Security.Claims;

namespace StaffManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SharedFileController : ControllerBase
    {
        private readonly ISharedFileService _sharedFileService;
        private readonly ILogger<SharedFileController> _logger;

        public SharedFileController(ISharedFileService sharedFileService, ILogger<SharedFileController> logger)
        {
            _sharedFileService = sharedFileService;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        [HttpGet]
        public async Task<IActionResult> GetFiles([FromQuery] string? groupId = null, [FromQuery] string? shareType = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var files = await _sharedFileService.GetFilesAsync(currentUserId, groupId, shareType);
                return Ok(new { success = true, data = files });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting files");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFile(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var file = await _sharedFileService.GetFileByIdAsync(id, currentUserId);

                if (file == null)
                    return NotFound(new { success = false, message = "File not found or access denied" });

                return Ok(new { success = true, data = file });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("upload")]
        [RequestSizeLimit(100_000_000)] // 100MB limit
        public async Task<IActionResult> UploadFile([FromForm] UploadFileDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var file = await _sharedFileService.UploadFileAsync(dto, currentUserId);

                return Ok(new { success = true, data = file, message = "File uploaded successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFile(string id, [FromBody] UpdateFileDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var currentUserId = GetCurrentUserId();
                var file = await _sharedFileService.UpdateFileAsync(id, dto, currentUserId);

                if (file == null)
                    return NotFound(new { success = false, message = "File not found or access denied" });

                return Ok(new { success = true, data = file, message = "File updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating file {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _sharedFileService.DeleteFileAsync(id, currentUserId);

                if (!success)
                    return NotFound(new { success = false, message = "File not found or access denied" });

                return Ok(new { success = true, message = "File deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadFile(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var result = await _sharedFileService.DownloadFileAsync(id, currentUserId);

                if (result == null)
                    return NotFound(new { success = false, message = "File not found or access denied" });

                var (fileStream, fileName, contentType) = result.Value;

                return File(fileStream, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("{id}/share")]
        public async Task<IActionResult> ShareFile(string id, [FromBody] ShareFileDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                dto.FileId = id; // Ensure correct file ID
                var currentUserId = GetCurrentUserId();
                var share = await _sharedFileService.ShareFileAsync(dto, currentUserId);

                return Ok(new { success = true, data = share, message = "File shared successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sharing file {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("{id}/shares")]
        public async Task<IActionResult> GetFileShares(string id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var shares = await _sharedFileService.GetFileSharesAsync(id, currentUserId);
                return Ok(new { success = true, data = shares });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file shares for {FileId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("shared-with-me")]
        public async Task<IActionResult> GetSharedWithMe()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var shares = await _sharedFileService.GetSharedWithMeAsync(currentUserId);
                return Ok(new { success = true, data = shares });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting files shared with user");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("shares/{shareId}")]
        public async Task<IActionResult> RevokeShare(string shareId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var success = await _sharedFileService.RevokeShareAsync(shareId, currentUserId);

                if (!success)
                    return NotFound(new { success = false, message = "Share not found or access denied" });

                return Ok(new { success = true, message = "Share revoked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking share {ShareId}", shareId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentFiles([FromQuery] int count = 10)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var files = await _sharedFileService.GetRecentFilesAsync(currentUserId, count);
                return Ok(new { success = true, data = files });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent files");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("storage-usage")]
        public async Task<IActionResult> GetStorageUsage()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var usage = await _sharedFileService.GetUserStorageUsageAsync(currentUserId);

                return Ok(new {
                    success = true,
                    data = new {
                        usageBytes = usage,
                        usageFormatted = FormatFileSize(usage)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting storage usage");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("groups/{groupId}/storage-usage")]
        public async Task<IActionResult> GetGroupStorageUsage(string groupId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var usage = await _sharedFileService.GetGroupStorageUsageAsync(groupId, currentUserId);

                return Ok(new {
                    success = true,
                    data = new {
                        usageBytes = usage,
                        usageFormatted = FormatFileSize(usage)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group storage usage");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
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