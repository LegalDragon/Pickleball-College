using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pickleball.College.Database;
using Pickleball.College.Models.Configuration;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Services;

public interface IAssetService
{
    Task<AssetUploadResult> UploadFileAsync(IFormFile file, string category, int? userId = null, string? customFolder = null);
    Task<bool> DeleteFileAsync(string assetUrl);
    Task<Asset?> GetAssetByKeyAsync(string assetKey);
    Task<(Stream? stream, string? contentType, string? fileName)> GetAssetStreamAsync(string assetKey);
    string GetUploadPath(string category);
    string GetAssetUrl(string assetKey);
    string GetRelativePathFromUrl(string url);
    ValidationResult ValidateFile(IFormFile file, string category);
    CategoryOptions? GetCategoryOptions(string category);
}

public class AssetUploadResult
{
    public bool Success { get; set; }
    public string? Url { get; set; }
    public string? AssetKey { get; set; }
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
    private readonly ApplicationDbContext _context;
    private readonly FileStorageOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        ApplicationDbContext context,
        IOptions<FileStorageOptions> options,
        IWebHostEnvironment environment,
        ILogger<AssetService> logger)
    {
        _context = context;
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task<AssetUploadResult> UploadFileAsync(IFormFile file, string category, int? userId = null, string? customFolder = null)
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

            // Generate unique filename and asset key
            var assetKey = Guid.NewGuid().ToString("N");
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{assetKey}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create asset record in database
            var asset = new Asset
            {
                AssetKey = assetKey,
                FilePath = filePath,
                FileName = fileName,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                Category = category,
                UploadedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            var assetUrl = GetAssetUrl(assetKey);

            _logger.LogInformation("File uploaded successfully: {AssetKey} -> {FilePath}", assetKey, filePath);

            return new AssetUploadResult
            {
                Success = true,
                Url = assetUrl,
                AssetKey = assetKey,
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

    public async Task<bool> DeleteFileAsync(string assetUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(assetUrl))
                return false;

            // Extract asset key from URL
            var assetKey = ExtractAssetKeyFromUrl(assetUrl);
            if (string.IsNullOrEmpty(assetKey))
            {
                _logger.LogWarning("Could not extract asset key from URL: {Url}", assetUrl);
                return false;
            }

            // Find asset in database
            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.AssetKey == assetKey && !a.IsDeleted);
            if (asset == null)
            {
                _logger.LogWarning("Asset not found: {AssetKey}", assetKey);
                return false;
            }

            // Delete physical file
            if (File.Exists(asset.FilePath))
            {
                File.Delete(asset.FilePath);
            }

            // Mark as deleted in database (soft delete)
            asset.IsDeleted = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Asset deleted: {AssetKey}", assetKey);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting asset: {Url}", assetUrl);
            return false;
        }
    }

    public async Task<Asset?> GetAssetByKeyAsync(string assetKey)
    {
        return await _context.Assets.FirstOrDefaultAsync(a => a.AssetKey == assetKey && !a.IsDeleted);
    }

    public async Task<(Stream? stream, string? contentType, string? fileName)> GetAssetStreamAsync(string assetKey)
    {
        var asset = await GetAssetByKeyAsync(assetKey);
        if (asset == null)
            return (null, null, null);

        if (!File.Exists(asset.FilePath))
        {
            _logger.LogWarning("Asset file not found on disk: {FilePath}", asset.FilePath);
            return (null, null, null);
        }

        var stream = new FileStream(asset.FilePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, asset.ContentType, asset.OriginalFileName ?? asset.FileName);
    }

    public string GetUploadPath(string category)
    {
        // Use configured BasePath as primary storage location
        var basePath = !string.IsNullOrEmpty(_options.BasePath) ? _options.BasePath : _environment.WebRootPath ?? "wwwroot";
        var categoryOptions = _options.GetCategory(category);
        var folder = categoryOptions?.Folder ?? category;
        return Path.Combine(basePath, _options.UploadsFolder, folder);
    }

    public string GetAssetUrl(string assetKey)
    {
        // Return API endpoint URL for serving assets
        if (!string.IsNullOrEmpty(_options.AssetBaseUrl))
        {
            return $"{_options.AssetBaseUrl.TrimEnd('/')}/api/assets/{assetKey}";
        }
        return $"/api/assets/{assetKey}";
    }

    public string GetRelativePathFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return url;

        // Extract asset key from API URL
        var assetKey = ExtractAssetKeyFromUrl(url);
        if (!string.IsNullOrEmpty(assetKey))
        {
            return $"/api/assets/{assetKey}";
        }

        return url;
    }

    private string? ExtractAssetKeyFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return null;

        // Handle both full URLs and relative paths
        // Format: /api/assets/{assetKey} or https://assets.example.com/api/assets/{assetKey}
        var pattern = "/api/assets/";
        var index = url.LastIndexOf(pattern, StringComparison.OrdinalIgnoreCase);
        if (index >= 0)
        {
            var assetKey = url.Substring(index + pattern.Length);
            // Remove any query string or trailing slash
            var queryIndex = assetKey.IndexOf('?');
            if (queryIndex >= 0)
                assetKey = assetKey.Substring(0, queryIndex);
            return assetKey.TrimEnd('/');
        }

        return null;
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
