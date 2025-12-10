using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class VideoReviewRequest
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    // Null = open request to any coach, otherwise specific coach
    public int? CoachId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(500)]
    public string VideoUrl { get; set; } = string.Empty;

    // Price offered by student
    public decimal OfferedPrice { get; set; }

    // Status: Open, Accepted, Completed, Cancelled
    public string Status { get; set; } = "Open";

    // Coach who accepted (for open requests)
    public int? AcceptedByCoachId { get; set; }

    // Coach's video response
    [MaxLength(500)]
    public string? ReviewVideoUrl { get; set; }

    [MaxLength(2000)]
    public string? ReviewNotes { get; set; }

    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Student { get; set; } = null!;
    public User? TargetCoach { get; set; }
    public User? AcceptedByCoach { get; set; }
}
