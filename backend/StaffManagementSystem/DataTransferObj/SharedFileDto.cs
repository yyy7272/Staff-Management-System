namespace StaffManagementSystem.DataTransferObj
{
    public class SharedFileDto
    {
        public string Id { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Tags { get; set; } = new();
        public string UploaderId { get; set; } = string.Empty;
        public string UploaderName { get; set; } = string.Empty;
        public string? GroupId { get; set; }
        public string? GroupName { get; set; }
        public string ShareType { get; set; } = "group";
        public string Status { get; set; } = "active";
        public int DownloadCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<FileVersionDto> Versions { get; set; } = new();
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanDownload { get; set; }
    }

    public class UploadFileDto
    {
        public IFormFile File { get; set; } = null!;
        public string? Description { get; set; }
        public string Tags { get; set; } = string.Empty; // JSON string of tags
        public string? GroupId { get; set; }
        public string ShareType { get; set; } = "group"; // group, company, department
    }

    public class UpdateFileDto
    {
        public string? Description { get; set; }
        public string? Tags { get; set; } // JSON string of tags
        public string? Status { get; set; }
    }

    public class FileVersionDto
    {
        public string Id { get; set; } = string.Empty;
        public int VersionNumber { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; } = string.Empty;
        public string? ChangeDescription { get; set; }
        public string UploadedById { get; set; } = string.Empty;
        public string UploadedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class ShareFileDto
    {
        public string FileId { get; set; } = string.Empty;
        public string ShareType { get; set; } = "employee"; // employee, group, department, company
        public string? EmployeeId { get; set; }
        public string? GroupId { get; set; }
        public string? DepartmentId { get; set; }
        public string Permission { get; set; } = "view"; // view, download, edit
        public string? Message { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class FileShareDto
    {
        public string Id { get; set; } = string.Empty;
        public string FileId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string SharedById { get; set; } = string.Empty;
        public string SharedByName { get; set; } = string.Empty;
        public string? SharedWithId { get; set; }
        public string? SharedWithName { get; set; }
        public string ShareType { get; set; } = "employee";
        public string Permission { get; set; } = "view";
        public string? Message { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime SharedAt { get; set; }
        public DateTime? AccessedAt { get; set; }
        public string Status { get; set; } = "active";
    }

    public class FileUploadVersionDto
    {
        public IFormFile File { get; set; } = null!;
        public string? ChangeDescription { get; set; }
    }
}