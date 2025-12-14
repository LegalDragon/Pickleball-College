using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class BlogPost
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Summary { get; set; }

    public string? FeaturedImageUrl { get; set; }

    public bool IsPublished { get; set; } = false;

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public int ViewCount { get; set; } = 0;

    // Foreign key
    [Required]
    public Guid AuthorId { get; set; }

    // Navigation property
    public User Author { get; set; } = null!;
}
