namespace Pickleball.College.Models.DTOs;

public class AssetUploadResponse
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class AllowedFileTypeInfo
{
    public List<string> Extensions { get; set; } = new();
    public long MaxSizeBytes { get; set; }
    public long MaxSizeMB { get; set; }
}
