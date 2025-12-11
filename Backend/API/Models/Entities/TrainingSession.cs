using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class TrainingSession
{
    public int Id { get; set; }
    public int CoachId { get; set; }
    public int StudentId { get; set; }
    public int? MaterialId { get; set; }

    [Required]
    public string SessionType { get; set; } = "Online";

    // RequestedAt = when student requested, ScheduledAt = confirmed time by coach
    public DateTime? RequestedAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }

    // Status: Pending, Confirmed, Completed, Cancelled
    public string Status { get; set; } = "Pending";

    public string? MeetingLink { get; set; }
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Coach proposal fields (for counter-proposals)
    public DateTime? ProposedScheduledAt { get; set; }
    public int? ProposedDurationMinutes { get; set; }
    public decimal? ProposedPrice { get; set; }
    [MaxLength(200)]
    public string? ProposedLocation { get; set; }
    [MaxLength(500)]
    public string? ProposalNote { get; set; }
    public DateTime? ProposedAt { get; set; }

    public User Coach { get; set; } = null!;
    public User Student { get; set; } = null!;
    public TrainingMaterial? Material { get; set; }
}
