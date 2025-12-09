using System.ComponentModel.DataAnnotations;

namespace Pickleball.College.Models.Entities;

public class User
{
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string? PasswordHash { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = "Student";
    
    [Required]
    public string? FirstName { get; set; } = string.Empty;
    
    [Required]
    public string? LastName { get; set; } = string.Empty;

    public string? RefreshToken{ get; set; } = string.Empty;
    public string? Bio { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public CoachProfile? CoachProfile { get; set; }
    public ICollection<TrainingMaterial> TrainingMaterials { get; set; } = new List<TrainingMaterial>();
    public ICollection<MaterialPurchase> MaterialPurchases { get; set; } = new List<MaterialPurchase>();
    public ICollection<TrainingSession> CoachingSessions { get; set; } = new List<TrainingSession>();
    public ICollection<TrainingSession> StudentSessions { get; set; } = new List<TrainingSession>();
}
