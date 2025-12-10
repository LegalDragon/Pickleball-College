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

    public async Task<MaterialDto> CreateMaterialAsync(int coachId, CreateMaterialRequest request, string? videoUrl, string? thumbnailUrl)
    {
        var material = new TrainingMaterial
        {
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

    public async Task<MaterialDto> UpdateMaterialAsync(int materialId, int coachId, UpdateMaterialRequest request, string? videoUrl, string? thumbnailUrl)
    {
        var material = await _context.TrainingMaterials
            .FirstOrDefaultAsync(m => m.Id == materialId && m.CoachId == coachId);

        if (material == null)
        {
            throw new ArgumentException("Material not found or unauthorized");
        }

        // Update basic fields
        material.Title = request.Title;
        material.Description = request.Description;
        material.ContentType = request.ContentType;
        material.Price = request.Price;
        material.ExternalLink = request.ExternalLink;
        material.UpdatedAt = DateTime.UtcNow;

        // Update video URL if provided (from file upload or request)
        if (!string.IsNullOrEmpty(videoUrl))
        {
            material.VideoUrl = videoUrl;
        }
        else if (!string.IsNullOrEmpty(request.VideoUrl))
        {
            material.VideoUrl = request.VideoUrl;
        }

        // Update thumbnail URL if provided (from file upload or request)
        if (!string.IsNullOrEmpty(thumbnailUrl))
        {
            material.ThumbnailUrl = thumbnailUrl;
        }
        else if (!string.IsNullOrEmpty(request.ThumbnailUrl))
        {
            material.ThumbnailUrl = request.ThumbnailUrl;
        }

        await _context.SaveChangesAsync();

        return await GetMaterialDtoAsync(materialId);
    }

    public async Task<PurchaseResult> PurchaseMaterialAsync(int studentId, int materialId)
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
                CoachId = m.CoachId,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                ExternalLink = m.ExternalLink,
                IsPublished = m.IsPublished,
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

    public async Task<List<MaterialDto>> GetCoachMaterialsAsync(int coachId)
    {
        return await _context.TrainingMaterials
            .Where(m => m.CoachId == coachId)
            .Include(m => m.Coach)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                CoachId = m.CoachId,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                ExternalLink = m.ExternalLink,
                IsPublished = m.IsPublished,
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

    public async Task<MaterialDto> GetMaterialAsync(int materialId)
    {
        return await GetMaterialDtoAsync(materialId);
    }

    private async Task<MaterialDto> GetMaterialDtoAsync(int materialId)
    {
        return await _context.TrainingMaterials
            .Where(m => m.Id == materialId)
            .Include(m => m.Coach)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                CoachId = m.CoachId,
                Title = m.Title,
                Description = m.Description,
                ContentType = m.ContentType,
                Price = m.Price,
                ThumbnailUrl = m.ThumbnailUrl,
                VideoUrl = m.VideoUrl,
                ExternalLink = m.ExternalLink,
                IsPublished = m.IsPublished,
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

    public async Task<MaterialDto> TogglePublishAsync(int materialId, int coachId)
    {
        var material = await _context.TrainingMaterials
            .FirstOrDefaultAsync(m => m.Id == materialId && m.CoachId == coachId);

        if (material == null)
        {
            throw new ArgumentException("Material not found or unauthorized");
        }

        material.IsPublished = !material.IsPublished;
        material.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetMaterialDtoAsync(materialId);
    }
}
