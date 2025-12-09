using Microsoft.EntityFrameworkCore;
using Pickleball.College.Database;
using Pickleball.College.Models.DTOs;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Services;

public class MaterialService : IMaterialService
{
    private readonly ApplicationDbContext _context;
    private readonly IStripeService _stripeService;

    public MaterialService(ApplicationDbContext context, IStripeService stripeService)
    {
        _context = context;
        _stripeService = stripeService;
    }

    public async Task<MaterialDto> CreateMaterialAsync(Guid coachId, CreateMaterialRequest request, string? videoUrl, string? thumbnailUrl)
    {
        var material = new TrainingMaterial
        {
            Id = Guid.NewGuid(),
            CoachId = coachId,
            Title = request.Title,
            Description = request.Description,
            ContentType = request.ContentType, 
            Price = request.Price,
            VideoUrl = videoUrl,
            ThumbnailUrl = thumbnailUrl,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TrainingMaterials.Add(material);
        await _context.SaveChangesAsync();

        return await GetMaterialDtoAsync(material.Id);
    }

    public async Task<PurchaseResult> PurchaseMaterialAsync(Guid studentId, Guid materialId)
    {
        var material = await _context.TrainingMaterials
            .Include(m => m.Coach)
            .FirstOrDefaultAsync(m => m.Id == materialId);

        if (material == null)
        {
            throw new ArgumentException("Material not found");
        }

        // Create Stripe payment intent
        var paymentIntent = await _stripeService.CreatePaymentIntentAsync(material.Price, $"Purchase of {material.Title}");

        // Create purchase record
        var purchase = new MaterialPurchase
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            MaterialId = materialId,
            PurchasePrice = material.Price,
            PlatformFee = material.Price * 0.15m, // 15% platform fee
            CoachEarnings = material.Price * 0.85m, // 85% to coach
            StripePaymentIntentId = paymentIntent.Id,
            PurchasedAt = DateTime.UtcNow
        };

        _context.MaterialPurchases.Add(purchase);
        await _context.SaveChangesAsync();

        return new PurchaseResult
        {
            ClientSecret = paymentIntent.ClientSecret,
            PurchaseId = purchase.Id,
            Amount = material.Price
        };
    }

    public async Task<List<MaterialDto>> GetPublishedMaterialsAsync()
    {
        return await _context.TrainingMaterials
            .Where(m => m.IsPublished)
            .Include(m => m.Coach)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                CreatedAt = m.CreatedAt,
                Coach = new CoachDto
                {
                    FirstName = m.Coach.FirstName,
                    LastName = m.Coach.LastName,
                    ProfileImageUrl = m.Coach.ProfileImageUrl
                }
            })
            .ToListAsync();
    }

    public async Task<List<MaterialDto>> GetCoachMaterialsAsync(Guid coachId)
    {
        return await _context.TrainingMaterials
            .Where(m => m.CoachId == coachId)
            .Include(m => m.Coach)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                CreatedAt = m.CreatedAt,
                Coach = new CoachDto
                {
                    FirstName = m.Coach.FirstName,
                    LastName = m.Coach.LastName,
                    ProfileImageUrl = m.Coach.ProfileImageUrl
                }
            })
            .ToListAsync();
    }

    public async Task<MaterialDto> GetMaterialAsync(Guid materialId)
    {
        return await GetMaterialDtoAsync(materialId);
    }

    private async Task<MaterialDto> GetMaterialDtoAsync(Guid materialId)
    {
        return await _context.TrainingMaterials
            .Where(m => m.Id == materialId)
            .Include(m => m.Coach)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                CreatedAt = m.CreatedAt,
                Coach = new CoachDto
                {
                    FirstName = m.Coach.FirstName,
                    LastName = m.Coach.LastName,
                    ProfileImageUrl = m.Coach.ProfileImageUrl
                }
            })
            .FirstOrDefaultAsync() ?? throw new ArgumentException("Material not found");
    }
}
