using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class Asset
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(36)]
    public string AssetKey { get; set; } = Guid.NewGuid().ToString("N");

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? OriginalFileName { get; set; }

    [MaxLength(100)]
    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// The type of object this asset is associated with (e.g., "User", "ThemeSettings", "Material")
    /// </summary>
    [MaxLength(100)]
    public string? ObjectType { get; set; }

    /// <summary>
    /// The ID of the object this asset is associated with
    /// </summary>
    public int? ObjectId { get; set; }

    public int? UploadedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
}
