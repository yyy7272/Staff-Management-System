using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace StaffManagementSystem.Services
{
    public interface IImageProcessingService
    {
        Task<(string originalPath, string thumbnailPath)> ProcessAvatarAsync(IFormFile file, string UserId);
        Task DeleteAvatarAsync(string imagePath);
        bool IsValidImageFile(IFormFile file);
    }

    public class ImageProcessingService : IImageProcessingService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ImageProcessingService> _logger;
        private readonly string _uploadsPath;
        private readonly string _avatarsPath;

        // Allowed image types and sizes
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private readonly long _maxFileSize = 5 * 1024 * 1024; // 5MB
        private const int AVATAR_SIZE = 200;
        private const int THUMBNAIL_SIZE = 100;

        public ImageProcessingService(IWebHostEnvironment environment, ILogger<ImageProcessingService> logger)
        {
            _environment = environment;
            _logger = logger;
            _uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads");
            _avatarsPath = Path.Combine(_uploadsPath, "avatars");
            
            // Ensure directories exist
            Directory.CreateDirectory(_avatarsPath);
        }

        public bool IsValidImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return false;

            if (file.Length > _maxFileSize)
            {
                _logger.LogWarning("File too large: {Size} bytes", file.Length);
                return false;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Invalid file extension: {Extension}", extension);
                return false;
            }

            // Check if it's actually an image by trying to load it
            try
            {
                using var stream = file.OpenReadStream();
                using var image = Image.Load(stream);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid image file: {FileName}", file.FileName);
                return false;
            }
        }

        public async Task<(string originalPath, string thumbnailPath)> ProcessAvatarAsync(IFormFile file, string UserId)
        {
            if (!IsValidImageFile(file))
                throw new ArgumentException("Invalid image file");

            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var fileName = $"{UserId}_{timestamp}";
            
            var originalPath = Path.Combine(_avatarsPath, $"{fileName}.jpg");
            var thumbnailPath = Path.Combine(_avatarsPath, $"{fileName}_thumb.jpg");

            try
            {
                using var inputStream = file.OpenReadStream();
                using var image = await Image.LoadAsync(inputStream);

                // Process original image (200x200)
                var originalImage = image.Clone(ctx => ctx
                    .Resize(new ResizeOptions
                    {
                        Size = new Size(AVATAR_SIZE, AVATAR_SIZE),
                        Mode = ResizeMode.Crop,
                        Position = AnchorPositionMode.Center
                    }));

                await originalImage.SaveAsJpegAsync(originalPath, new JpegEncoder
                {
                    Quality = 90
                });

                // Process thumbnail (100x100)
                var thumbnailImage = image.Clone(ctx => ctx
                    .Resize(new ResizeOptions
                    {
                        Size = new Size(THUMBNAIL_SIZE, THUMBNAIL_SIZE),
                        Mode = ResizeMode.Crop,
                        Position = AnchorPositionMode.Center
                    }));

                await thumbnailImage.SaveAsJpegAsync(thumbnailPath, new JpegEncoder
                {
                    Quality = 85
                });

                _logger.LogInformation("Avatar processed successfully for User {UserId}", UserId);
                
                return (originalPath, thumbnailPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing avatar for User {UserId}", UserId);
                
                // Clean up any partial files
                if (File.Exists(originalPath)) File.Delete(originalPath);
                if (File.Exists(thumbnailPath)) File.Delete(thumbnailPath);
                
                throw;
            }
        }

        public async Task DeleteAvatarAsync(string imagePath)
        {
            try
            {
                if (string.IsNullOrEmpty(imagePath) || !File.Exists(imagePath))
                    return;

                await Task.Run(() => File.Delete(imagePath));
                
                // Also delete thumbnail if it exists
                var thumbnailPath = imagePath.Replace(".jpg", "_thumb.jpg");
                if (File.Exists(thumbnailPath))
                    await Task.Run(() => File.Delete(thumbnailPath));

                _logger.LogInformation("Avatar deleted: {ImagePath}", imagePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting avatar: {ImagePath}", imagePath);
                throw;
            }
        }
    }
}