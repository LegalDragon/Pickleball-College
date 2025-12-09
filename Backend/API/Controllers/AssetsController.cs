using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pickleball.College.Database;
using Pickleball.College.Models.Entities;
using Pickleball.College.Models.DTOs;
using Pickleball.College.Services;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAssetService _assetService;
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(
        ApplicationDbContext context,
        IAssetService assetService,
        ILogger<AssetsController> logger)
    {
        _context = context;
        _assetService = assetService;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Get an asset by its key (serves the file)
    /// </summary>
    /// <param name="assetKey">The unique asset key</param>
    [AllowAnonymous]
    [HttpGet("{assetKey}")]
    public async Task<IActionResult> GetAsset(string assetKey)
    {
        try
        {
            if (string.IsNullOrEmpty(assetKey))
            {
                return BadRequest("Asset key is required");
            }

            var (stream, contentType, fileName) = await _assetService.GetAssetStreamAsync(assetKey);

            if (stream == null)
            {
                return NotFound("Asset not found");
            }

            // Return the file with appropriate content type
            return File(stream, contentType ?? "application/octet-stream", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset: {AssetKey}", assetKey);
            return StatusCode(500, "An error occurred while retrieving the asset");
        }
    }

    /// <summary>
    /// Upload a single file
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="category">Category: avatars, videos, theme, materials, or custom folder name</param>
    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<AssetUploadResponse>>> UploadFile(
        IFormFile file,
        [FromQuery] string category = "image")
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

            var result = await _assetService.UploadFileAsync(file, category, userId);

            if (!result.Success)
            {
                return BadRequest(new ApiResponse<AssetUploadResponse>
                {
                    Success = false,
                    Message = result.ErrorMessage ?? "Upload failed"
                });
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = userId.Value,
                ActivityType = "AssetUploaded",
                Description = $"Uploaded {category} file: {file.FileName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<AssetUploadResponse>
            {
                Success = true,
                Message = "File uploaded successfully",
                Data = new AssetUploadResponse
                {
                    Url = result.Url!,
                    FileName = result.FileName!,
                    OriginalFileName = result.OriginalFileName!,
                    FileSize = result.FileSize,
                    ContentType = result.ContentType!,
                    Category = result.Category!
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
        [FromQuery] string category = "image")
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

            var uploadedFiles = new List<AssetUploadResponse>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                var result = await _assetService.UploadFileAsync(file, category, userId);

                if (result.Success)
                {
                    uploadedFiles.Add(new AssetUploadResponse
                    {
                        Url = result.Url!,
                        FileName = result.FileName!,
                        OriginalFileName = result.OriginalFileName!,
                        FileSize = result.FileSize,
                        ContentType = result.ContentType!,
                        Category = result.Category!
                    });
                }
                else
                {
                    errors.Add($"{file.FileName}: {result.ErrorMessage}");
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

            var deleted = await _assetService.DeleteFileAsync(url);

            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File not found or could not be deleted"
                });
            }

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
        var categories = new[] { "avatars", "videos", "theme", "materials" };
        var result = new Dictionary<string, AllowedFileTypeInfo>();

        foreach (var category in categories)
        {
            var options = _assetService.GetCategoryOptions(category);
            if (options != null)
            {
                result[category] = new AllowedFileTypeInfo
                {
                    Extensions = options.AllowedExtensions.ToList(),
                    MaxSizeBytes = options.MaxSizeBytes,
                    MaxSizeMB = options.MaxSizeMB
                };
            }
        }

        return Ok(new ApiResponse<Dictionary<string, AllowedFileTypeInfo>>
        {
            Success = true,
            Data = result
        });
    }
}
