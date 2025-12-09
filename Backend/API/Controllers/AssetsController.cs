using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pickleball.College.Database;
using Pickleball.College.Models.Entities;
using Pickleball.College.Models.DTOs;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AssetsController> _logger;

    // Allowed file types by category
    private static readonly Dictionary<string, string[]> AllowedExtensions = new()
    {
        { "image", new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" } },
        { "video", new[] { ".mp4", ".webm", ".mov", ".avi" } },
        { "document", new[] { ".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".pptx", ".ppt" } },
        { "all", new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov", ".avi", ".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".pptx", ".ppt" } }
    };

    // Max file sizes by category (in bytes)
    private static readonly Dictionary<string, long> MaxFileSizes = new()
    {
        { "image", 10 * 1024 * 1024 },     // 10MB
        { "video", 100 * 1024 * 1024 },    // 100MB
        { "document", 25 * 1024 * 1024 },  // 25MB
        { "all", 100 * 1024 * 1024 }       // 100MB
    };

    public AssetsController(ApplicationDbContext context, IWebHostEnvironment environment, ILogger<AssetsController> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Upload a single file
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="category">Category: image, video, document, or all (default: all)</param>
    /// <param name="folder">Optional subfolder name</param>
    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<AssetUploadResponse>>> UploadFile(
        IFormFile file,
        [FromQuery] string category = "all",
        [FromQuery] string? folder = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new ApiResponse<AssetUploadResponse>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<AssetUploadResponse>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var categoryKey = category.ToLowerInvariant();

            if (!AllowedExtensions.ContainsKey(categoryKey))
            {
                categoryKey = "all";
            }

            if (!AllowedExtensions[categoryKey].Contains(extension))
            {
                return BadRequest(new ApiResponse<AssetUploadResponse>
                {
                    Success = false,
                    Message = $"Invalid file type. Allowed types for {categoryKey}: {string.Join(", ", AllowedExtensions[categoryKey])}"
                });
            }

            var maxSize = MaxFileSizes[categoryKey];
            if (file.Length > maxSize)
            {
                return BadRequest(new ApiResponse<AssetUploadResponse>
                {
                    Success = false,
                    Message = $"File size exceeds maximum allowed ({maxSize / (1024 * 1024)}MB)"
                });
            }

            // Determine upload path
            var subFolder = string.IsNullOrEmpty(folder) ? categoryKey : folder;
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", subFolder);
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var assetUrl = $"/uploads/{subFolder}/{fileName}";

            // Log activity
            var log = new ActivityLog
            {
                UserId = userId.Value,
                ActivityType = "AssetUploaded",
                Description = $"Uploaded {categoryKey} file: {file.FileName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<AssetUploadResponse>
            {
                Success = true,
                Message = "File uploaded successfully",
                Data = new AssetUploadResponse
                {
                    Url = assetUrl,
                    FileName = fileName,
                    OriginalFileName = file.FileName,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    Category = categoryKey
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new ApiResponse<AssetUploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading file"
            });
        }
    }

    /// <summary>
    /// Upload multiple files
    /// </summary>
    [HttpPost("upload-multiple")]
    public async Task<ActionResult<ApiResponse<List<AssetUploadResponse>>>> UploadMultipleFiles(
        List<IFormFile> files,
        [FromQuery] string category = "all",
        [FromQuery] string? folder = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new ApiResponse<List<AssetUploadResponse>>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            if (files == null || files.Count == 0)
            {
                return BadRequest(new ApiResponse<List<AssetUploadResponse>>
                {
                    Success = false,
                    Message = "No files provided"
                });
            }

            if (files.Count > 10)
            {
                return BadRequest(new ApiResponse<List<AssetUploadResponse>>
                {
                    Success = false,
                    Message = "Maximum 10 files can be uploaded at once"
                });
            }

            var categoryKey = category.ToLowerInvariant();
            if (!AllowedExtensions.ContainsKey(categoryKey))
            {
                categoryKey = "all";
            }

            var subFolder = string.IsNullOrEmpty(folder) ? categoryKey : folder;
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", subFolder);
            Directory.CreateDirectory(uploadsPath);

            var uploadedFiles = new List<AssetUploadResponse>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                try
                {
                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

                    if (!AllowedExtensions[categoryKey].Contains(extension))
                    {
                        errors.Add($"{file.FileName}: Invalid file type");
                        continue;
                    }

                    var maxSize = MaxFileSizes[categoryKey];
                    if (file.Length > maxSize)
                    {
                        errors.Add($"{file.FileName}: File too large");
                        continue;
                    }

                    var fileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var assetUrl = $"/uploads/{subFolder}/{fileName}";

                    uploadedFiles.Add(new AssetUploadResponse
                    {
                        Url = assetUrl,
                        FileName = fileName,
                        OriginalFileName = file.FileName,
                        FileSize = file.Length,
                        ContentType = file.ContentType,
                        Category = categoryKey
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error uploading file: {file.FileName}");
                    errors.Add($"{file.FileName}: Upload failed");
                }
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = userId.Value,
                ActivityType = "MultipleAssetsUploaded",
                Description = $"Uploaded {uploadedFiles.Count} files"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            var message = uploadedFiles.Count > 0
                ? $"Successfully uploaded {uploadedFiles.Count} file(s)"
                : "No files were uploaded";

            if (errors.Count > 0)
            {
                message += $". Errors: {string.Join("; ", errors)}";
            }

            return Ok(new ApiResponse<List<AssetUploadResponse>>
            {
                Success = uploadedFiles.Count > 0,
                Message = message,
                Data = uploadedFiles
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading multiple files");
            return StatusCode(500, new ApiResponse<List<AssetUploadResponse>>
            {
                Success = false,
                Message = "An error occurred while uploading files"
            });
        }
    }

    /// <summary>
    /// Delete a file by URL
    /// </summary>
    [HttpDelete]
    public async Task<ActionResult<ApiResponse<object>>> DeleteFile([FromQuery] string url)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            if (string.IsNullOrEmpty(url))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "URL is required"
                });
            }

            // Security: Ensure the URL is within the uploads directory
            if (!url.StartsWith("/uploads/"))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid file URL"
                });
            }

            var filePath = Path.Combine(_environment.WebRootPath ?? "wwwroot", url.TrimStart('/'));

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File not found"
                });
            }

            System.IO.File.Delete(filePath);

            // Log activity
            var log = new ActivityLog
            {
                UserId = userId.Value,
                ActivityType = "AssetDeleted",
                Description = $"Deleted asset: {url}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "File deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting file"
            });
        }
    }

    /// <summary>
    /// Get allowed file types by category
    /// </summary>
    [AllowAnonymous]
    [HttpGet("allowed-types")]
    public ActionResult<ApiResponse<Dictionary<string, AllowedFileTypeInfo>>> GetAllowedTypes()
    {
        var result = AllowedExtensions.ToDictionary(
            kvp => kvp.Key,
            kvp => new AllowedFileTypeInfo
            {
                Extensions = kvp.Value.ToList(),
                MaxSizeBytes = MaxFileSizes[kvp.Key],
                MaxSizeMB = MaxFileSizes[kvp.Key] / (1024 * 1024)
            }
        );

        return Ok(new ApiResponse<Dictionary<string, AllowedFileTypeInfo>>
        {
            Success = true,
            Data = result
        });
    }
}
