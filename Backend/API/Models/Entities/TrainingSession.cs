using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class TrainingSession
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? MaterialId { get; set; }
    
    [Required]
    public string SessionType { get; set; } = "Online";
    
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string? MeetingLink { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User Coach { get; set; } = null!;
    public User Student { get; set; } = null!;
    public TrainingMaterial? Material { get; set; }
}
