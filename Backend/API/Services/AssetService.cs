using Microsoft.Extensions.Options;
using Pickleball.College.Models.Configuration;

namespace Pickleball.College.Services;

public interface IAssetService
{
    Task<AssetUploadResult> UploadFileAsync(IFormFile file, string category, string? customFolder = null);
    Task<bool> DeleteFileAsync(string fileUrl);
    string GetUploadPath(string category);
    string GetFileUrl(string category, string fileName);
    ValidationResult ValidateFile(IFormFile file, string category);
    CategoryOptions? GetCategoryOptions(string category);
}

public class AssetUploadResult
{
    public bool Success { get; set; }
    public string? Url { get; set; }
    public string? FileName { get; set; }
    public string? OriginalFileName { get; set; }
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string? Category { get; set; }
    public string? ErrorMessage { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }

    public static ValidationResult Valid() => new() { IsValid = true };
    public static ValidationResult Invalid(string message) => new() { IsValid = false, ErrorMessage = message };
}

public class AssetService : IAssetService
{
    private readonly FileStorageOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        IOptions<FileStorageOptions> options,
        IWebHostEnvironment environment,
        ILogger<AssetService> logger)
    {
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task<AssetUploadResult> UploadFileAsync(IFormFile file, string category, string? customFolder = null)
    {
        try
        {
            // Validate the file
            var validation = ValidateFile(file, category);
            if (!validation.IsValid)
            {
                return new AssetUploadResult
                {
                    Success = false,
                    ErrorMessage = validation.ErrorMessage
                };
            }

            // Get upload path
            var uploadPath = GetUploadPath(customFolder ?? category);
            Directory.CreateDirectory(uploadPath);

            // Generate unique filename
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = GetFileUrl(customFolder ?? category, fileName);

            _logger.LogInformation("File uploaded successfully: {Url}", fileUrl);

            return new AssetUploadResult
            {
                Success = true,
                Url = fileUrl,
                FileName = fileName,
                OriginalFileName = file.FileName,
                FileSize = file.Length,
                ContentType = file.ContentType,
                Category = category
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file for category {Category}", category);
            return new AssetUploadResult
            {
                Success = false,
                ErrorMessage = "An error occurred while uploading the file"
            };
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return false;

            // Security: Ensure the URL is within the uploads directory
            if (!fileUrl.StartsWith($"/{_options.UploadsFolder}/"))
            {
                _logger.LogWarning("Attempted to delete file outside uploads directory: {Url}", fileUrl);
                return false;
            }

            // Use configured BasePath as primary storage location
            var basePath = !string.IsNullOrEmpty(_options.BasePath) ? _options.BasePath : _environment.WebRootPath ?? "wwwroot";
            var filePath = Path.Combine(basePath, fileUrl.TrimStart('/'));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("File deleted: {Url}", fileUrl);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {Url}", fileUrl);
            return false;
        }
    }

    public string GetUploadPath(string category)
    {
        // Use configured BasePath as primary storage location
        var basePath = !string.IsNullOrEmpty(_options.BasePath) ? _options.BasePath : _environment.WebRootPath ?? "wwwroot";
        var categoryOptions = _options.GetCategory(category);
        var folder = categoryOptions?.Folder ?? category;
        return Path.Combine(basePath, _options.UploadsFolder, folder);
    }

    public string GetFileUrl(string category, string fileName)
    {
        var categoryOptions = _options.GetCategory(category);
        var folder = categoryOptions?.Folder ?? category;
        return $"/{_options.UploadsFolder}/{folder}/{fileName}";
    }

    public ValidationResult ValidateFile(IFormFile file, string category)
    {
        if (file == null || file.Length == 0)
        {
            return ValidationResult.Invalid("No file provided");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var categoryOptions = _options.GetCategory(category);

        if (categoryOptions != null)
        {
            // Use category-specific settings
            if (!categoryOptions.AllowedExtensions.Contains(extension))
            {
                return ValidationResult.Invalid(
                    $"Invalid file type. Allowed types for {category}: {string.Join(", ", categoryOptions.AllowedExtensions)}");
            }

            if (file.Length > categoryOptions.MaxSizeBytes)
            {
                return ValidationResult.Invalid(
                    $"File size exceeds maximum allowed ({categoryOptions.MaxSizeMB}MB)");
            }
        }
        else
        {
            // Use general settings based on file type
            var allAllowedExtensions = _options.AllowedImageExtensions
                .Concat(_options.AllowedVideoExtensions)
                .Concat(_options.AllowedDocumentExtensions)
                .ToArray();

            if (!allAllowedExtensions.Contains(extension))
            {
                return ValidationResult.Invalid(
                    $"Invalid file type. Extension {extension} is not allowed.");
            }

            // Determine max size based on file type
            long maxSize;
            if (_options.AllowedVideoExtensions.Contains(extension))
            {
                maxSize = _options.MaxVideoSizeMB * 1024L * 1024L;
            }
            else if (_options.AllowedDocumentExtensions.Contains(extension))
            {
                maxSize = _options.MaxDocumentSizeMB * 1024L * 1024L;
            }
            else
            {
                maxSize = _options.MaxImageSizeMB * 1024L * 1024L;
            }

            if (file.Length > maxSize)
            {
                return ValidationResult.Invalid(
                    $"File size exceeds maximum allowed ({maxSize / (1024 * 1024)}MB)");
            }
        }

        return ValidationResult.Valid();
    }

    public CategoryOptions? GetCategoryOptions(string category)
    {
        return _options.GetCategory(category);
    }
}
