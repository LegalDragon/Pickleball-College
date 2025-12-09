using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Pickleball.College.Database;
using Pickleball.College.Models.Entities;
using Pickleball.College.Models.DTOs;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThemeController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ThemeController> _logger;

    public ThemeController(ApplicationDbContext context, IWebHostEnvironment environment, ILogger<ThemeController> logger)
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

    // GET: api/Theme/active (Public - no auth required)
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> GetActiveTheme()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Return default theme if none exists
                return Ok(new ApiResponse<ThemeSettingsDto>
                {
                    Success = true,
                    Data = GetDefaultTheme()
                });
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while fetching theme"
            });
        }
    }

    // GET: api/Theme (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> GetTheme()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while fetching theme"
            });
        }
    }

    // PUT: api/Theme (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> UpdateTheme([FromBody] UpdateThemeRequest request)
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var currentUserId = GetCurrentUserId();

            // Update fields
            if (!string.IsNullOrEmpty(request.OrganizationName))
                theme.OrganizationName = request.OrganizationName;

            if (request.LogoUrl != null)
                theme.LogoUrl = request.LogoUrl;

            if (request.FaviconUrl != null)
                theme.FaviconUrl = request.FaviconUrl;

            // Primary colors
            if (!string.IsNullOrEmpty(request.PrimaryColor))
                theme.PrimaryColor = request.PrimaryColor;
            if (!string.IsNullOrEmpty(request.PrimaryDarkColor))
                theme.PrimaryDarkColor = request.PrimaryDarkColor;
            if (!string.IsNullOrEmpty(request.PrimaryLightColor))
                theme.PrimaryLightColor = request.PrimaryLightColor;

            // Accent colors
            if (!string.IsNullOrEmpty(request.AccentColor))
                theme.AccentColor = request.AccentColor;
            if (!string.IsNullOrEmpty(request.AccentDarkColor))
                theme.AccentDarkColor = request.AccentDarkColor;
            if (!string.IsNullOrEmpty(request.AccentLightColor))
                theme.AccentLightColor = request.AccentLightColor;

            // Status colors
            if (!string.IsNullOrEmpty(request.SuccessColor))
                theme.SuccessColor = request.SuccessColor;
            if (!string.IsNullOrEmpty(request.ErrorColor))
                theme.ErrorColor = request.ErrorColor;
            if (!string.IsNullOrEmpty(request.WarningColor))
                theme.WarningColor = request.WarningColor;
            if (!string.IsNullOrEmpty(request.InfoColor))
                theme.InfoColor = request.InfoColor;

            // Text colors
            if (!string.IsNullOrEmpty(request.TextPrimaryColor))
                theme.TextPrimaryColor = request.TextPrimaryColor;
            if (!string.IsNullOrEmpty(request.TextSecondaryColor))
                theme.TextSecondaryColor = request.TextSecondaryColor;
            if (!string.IsNullOrEmpty(request.TextLightColor))
                theme.TextLightColor = request.TextLightColor;

            // Background colors
            if (!string.IsNullOrEmpty(request.BackgroundColor))
                theme.BackgroundColor = request.BackgroundColor;
            if (!string.IsNullOrEmpty(request.BackgroundSecondaryColor))
                theme.BackgroundSecondaryColor = request.BackgroundSecondaryColor;

            // Other colors
            if (!string.IsNullOrEmpty(request.BorderColor))
                theme.BorderColor = request.BorderColor;
            if (!string.IsNullOrEmpty(request.ShadowColor))
                theme.ShadowColor = request.ShadowColor;

            // Typography
            if (!string.IsNullOrEmpty(request.FontFamily))
                theme.FontFamily = request.FontFamily;
            if (!string.IsNullOrEmpty(request.HeadingFontFamily))
                theme.HeadingFontFamily = request.HeadingFontFamily;

            // Custom CSS
            if (request.CustomCss != null)
                theme.CustomCss = request.CustomCss;

            theme.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            if (currentUserId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "ThemeUpdated",
                    Description = "Updated theme settings"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Message = "Theme updated successfully",
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while updating theme"
            });
        }
    }

    // POST: api/Theme/logo (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("logo")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadLogo(IFormFile file)
    {
        try
        {
            // Validate file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".svg", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Invalid file type. Only JPG, PNG, SVG, and WEBP are allowed."
                });
            }

            if (file.Length > 5 * 1024 * 1024) // 5MB
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "File size must be less than 5MB"
                });
            }

            // Create uploads directory
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "theme");
            Directory.CreateDirectory(uploadsPath);

            // Get current theme
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme != null && !string.IsNullOrEmpty(theme.LogoUrl))
            {
                // Delete old logo
                var oldFilePath = Path.Combine(_environment.WebRootPath ?? "wwwroot", theme.LogoUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath))
                {
                    System.IO.File.Delete(oldFilePath);
                }
            }

            // Save new logo
            var fileName = $"logo_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var logoUrl = $"/uploads/theme/{fileName}";

            // Update theme if exists
            if (theme != null)
            {
                theme.LogoUrl = logoUrl;
                theme.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Log activity
            var currentUserId = GetCurrentUserId();
            if (currentUserId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "LogoUpdated",
                    Description = "Updated organization logo"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Logo uploaded successfully",
                Data = new UploadResponse { Url = logoUrl }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading logo"
            });
        }
    }

    // POST: api/Theme/favicon (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("favicon")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadFavicon(IFormFile file)
    {
        try
        {
            // Validate file
            var allowedExtensions = new[] { ".ico", ".png", ".svg" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Invalid file type. Only ICO, PNG, and SVG are allowed."
                });
            }

            if (file.Length > 1 * 1024 * 1024) // 1MB
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "File size must be less than 1MB"
                });
            }

            // Create uploads directory
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "theme");
            Directory.CreateDirectory(uploadsPath);

            // Get current theme
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme != null && !string.IsNullOrEmpty(theme.FaviconUrl))
            {
                // Delete old favicon
                var oldFilePath = Path.Combine(_environment.WebRootPath ?? "wwwroot", theme.FaviconUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath))
                {
                    System.IO.File.Delete(oldFilePath);
                }
            }

            // Save new favicon
            var fileName = $"favicon_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var faviconUrl = $"/uploads/theme/{fileName}";

            // Update theme if exists
            if (theme != null)
            {
                theme.FaviconUrl = faviconUrl;
                theme.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Log activity
            var currentUserId = GetCurrentUserId();
            if (currentUserId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "FaviconUpdated",
                    Description = "Updated organization favicon"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Favicon uploaded successfully",
                Data = new UploadResponse { Url = faviconUrl }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading favicon");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading favicon"
            });
        }
    }

    // GET: api/Theme/presets (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("presets")]
    public async Task<ActionResult<ApiResponse<List<ThemePresetDto>>>> GetThemePresets()
    {
        try
        {
            var presets = await _context.ThemePresets
                .Select(p => new ThemePresetDto
                {
                    PresetId = p.PresetId,
                    PresetName = p.PresetName,
                    Description = p.Description,
                    PrimaryColor = p.PrimaryColor,
                    PrimaryDarkColor = p.PrimaryDarkColor,
                    PrimaryLightColor = p.PrimaryLightColor,
                    AccentColor = p.AccentColor,
                    AccentDarkColor = p.AccentDarkColor,
                    AccentLightColor = p.AccentLightColor,
                    PreviewImage = p.PreviewImage,
                    IsDefault = p.IsDefault
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<ThemePresetDto>>
            {
                Success = true,
                Data = presets
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching theme presets");
            return StatusCode(500, new ApiResponse<List<ThemePresetDto>>
            {
                Success = false,
                Message = "An error occurred while fetching theme presets"
            });
        }
    }

    // POST: api/Theme/reset (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("reset")]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> ResetToDefault()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var currentUserId = GetCurrentUserId();

            // Reset to default values
            var defaultTheme = GetDefaultTheme();
            theme.PrimaryColor = defaultTheme.PrimaryColor;
            theme.PrimaryDarkColor = defaultTheme.PrimaryDarkColor;
            theme.PrimaryLightColor = defaultTheme.PrimaryLightColor;
            theme.AccentColor = defaultTheme.AccentColor;
            theme.AccentDarkColor = defaultTheme.AccentDarkColor;
            theme.AccentLightColor = defaultTheme.AccentLightColor;
            theme.SuccessColor = defaultTheme.SuccessColor;
            theme.ErrorColor = defaultTheme.ErrorColor;
            theme.WarningColor = defaultTheme.WarningColor;
            theme.InfoColor = defaultTheme.InfoColor;
            theme.TextPrimaryColor = defaultTheme.TextPrimaryColor;
            theme.TextSecondaryColor = defaultTheme.TextSecondaryColor;
            theme.TextLightColor = defaultTheme.TextLightColor;
            theme.BackgroundColor = defaultTheme.BackgroundColor;
            theme.BackgroundSecondaryColor = defaultTheme.BackgroundSecondaryColor;
            theme.BorderColor = defaultTheme.BorderColor;
            theme.ShadowColor = defaultTheme.ShadowColor;
            theme.FontFamily = defaultTheme.FontFamily;
            theme.HeadingFontFamily = defaultTheme.HeadingFontFamily;
            theme.CustomCss = null;

            theme.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            if (currentUserId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "ThemeReset",
                    Description = "Reset theme to default"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Message = "Theme reset to default",
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while resetting theme"
            });
        }
    }

    // Helper methods
    private async Task<ThemeSettings> CreateDefaultThemeAsync()
    {
        var defaultTheme = new ThemeSettings
        {
            OrganizationName = "Pickleball College",
            PrimaryColor = "#047857",
            PrimaryDarkColor = "#065f46",
            PrimaryLightColor = "#d1fae5",
            AccentColor = "#f59e0b",
            AccentDarkColor = "#d97706",
            AccentLightColor = "#fef3c7",
            SuccessColor = "#10b981",
            ErrorColor = "#ef4444",
            WarningColor = "#f59e0b",
            InfoColor = "#3b82f6",
            TextPrimaryColor = "#111827",
            TextSecondaryColor = "#6b7280",
            TextLightColor = "#f9fafb",
            BackgroundColor = "#ffffff",
            BackgroundSecondaryColor = "#f3f4f6",
            BorderColor = "#e5e7eb",
            ShadowColor = "#00000026",
            FontFamily = "Inter, system-ui, sans-serif",
            HeadingFontFamily = "Playfair Display, serif",
            IsActive = true,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ThemeSettings.Add(defaultTheme);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created default theme settings");
        return defaultTheme;
    }

    private ThemeSettingsDto MapToDto(ThemeSettings theme)
    {
        return new ThemeSettingsDto
        {
            ThemeId = theme.ThemeId,
            OrganizationName = theme.OrganizationName,
            LogoUrl = theme.LogoUrl,
            FaviconUrl = theme.FaviconUrl,
            PrimaryColor = theme.PrimaryColor,
            PrimaryDarkColor = theme.PrimaryDarkColor,
            PrimaryLightColor = theme.PrimaryLightColor,
            AccentColor = theme.AccentColor,
            AccentDarkColor = theme.AccentDarkColor,
            AccentLightColor = theme.AccentLightColor,
            SuccessColor = theme.SuccessColor,
            ErrorColor = theme.ErrorColor,
            WarningColor = theme.WarningColor,
            InfoColor = theme.InfoColor,
            TextPrimaryColor = theme.TextPrimaryColor,
            TextSecondaryColor = theme.TextSecondaryColor,
            TextLightColor = theme.TextLightColor,
            BackgroundColor = theme.BackgroundColor,
            BackgroundSecondaryColor = theme.BackgroundSecondaryColor,
            BorderColor = theme.BorderColor,
            ShadowColor = theme.ShadowColor,
            FontFamily = theme.FontFamily,
            HeadingFontFamily = theme.HeadingFontFamily,
            CustomCss = theme.CustomCss,
            UpdatedAt = theme.UpdatedAt
        };
    }

    private ThemeSettingsDto GetDefaultTheme()
    {
        return new ThemeSettingsDto
        {
            OrganizationName = "Pickleball College",
            PrimaryColor = "#047857",
            PrimaryDarkColor = "#065f46",
            PrimaryLightColor = "#d1fae5",
            AccentColor = "#f59e0b",
            AccentDarkColor = "#d97706",
            AccentLightColor = "#fef3c7",
            SuccessColor = "#10b981",
            ErrorColor = "#ef4444",
            WarningColor = "#f59e0b",
            InfoColor = "#3b82f6",
            TextPrimaryColor = "#111827",
            TextSecondaryColor = "#6b7280",
            TextLightColor = "#f9fafb",
            BackgroundColor = "#ffffff",
            BackgroundSecondaryColor = "#f3f4f6",
            BorderColor = "#e5e7eb",
            ShadowColor = "#00000026",
            FontFamily = "Inter, system-ui, sans-serif",
            HeadingFontFamily = "Playfair Display, serif"
        };
    }
}
