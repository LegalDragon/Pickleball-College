namespace Pickleball.College.Models.Entities;

public class MaterialPurchase
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid MaterialId { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal CoachEarnings { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    
    public User Student { get; set; } = null!;
    public TrainingMaterial Material { get; set; } = null!;
}
